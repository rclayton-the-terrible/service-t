import { has, set } from 'lodash';
import { BaseConfig } from './config/BaseConfig';
import { BaseDeps } from './deps/BaseDeps';
import { asValue, AwilixContainer, createContainer, NameAndRegistrationPair } from 'awilix';
import { WebServerConfig } from './config/WebServerConfig';
import { Startable } from '@service-t/api/dist/Startable';
import { Stoppable } from '@service-t/api/dist/Stoppable';
import {
  awilixComponentNames,
  ConfigFactoryFn,
  DepsFactoryFn,
  InitializeOptions,
  Registry,
  RegistryFn,
} from './model/Service';
import { HttpBasedServer } from './model/HttpBasedServer';
import { HttpProtocols } from './config/HttpProtocols';
import { Service, ServiceContext, ServiceOperator, ServicePlugin } from './model/Service';
import { ServiceHealthResult, ServiceHealthStatuses } from "@service-t/api/dist/health/ServiceHealthEvaluator";
import { HealthCheckService } from "./model/HealthCheckService";
import { Logger } from 'pino';
import { createTerminus } from '@godaddy/terminus';

import InternalError from '@service-t/api/dist/errors/InternalError';
import BadConfigurationError from '@service-t/api/dist/errors/BadConfigurationError';
import ServiceUnavailableError from "@service-t/api/dist/errors/ServiceUnavailableError";

import baseConfig from './config/mappers/baseConfig';
import express, { Express } from 'express';
import createServers from 'create-servers';
import mergeConfigFactories from './factories/mergeConfigFactories';
import formatError from '@service-t/api/dist/errors/formatError';
import getBaseDeps from './deps/getBaseDeps';


type ConfigType<TConfig> = TConfig extends ServiceContext<infer T, any, any> ? T : never;
type DepsType<TDeps> = TDeps extends ServiceContext<any, infer T, any> ? T : never;
type RegistryType<TRegistry> = TRegistry extends ServiceContext<any, any, infer T> ? T : never;

export default class ServiceTemplate<
      TContext extends ServiceContext,
      TPlugin extends ServicePlugin<ConfigType<TContext>, DepsType<TContext>> = ServicePlugin<ConfigType<TContext>, DepsType<TContext>>
    >
implements Service<TContext, TPlugin> {

  protected configFactory?: ConfigFactoryFn<ConfigType<TContext>>;
  protected depsFactory?: DepsFactoryFn<BaseConfig & ConfigType<TContext>, DepsType<TContext>>;
  protected registryFactory?: RegistryType<TContext> | RegistryFn<RegistryType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>>;
  protected plugins: Array<TPlugin> = [];

  // The only reason I'm using an "_" prefix is because I want to name these the same as their matching method names.
  // The "_" variables also represent the initialized configuration of the server.
  protected _config?: BaseConfig & ConfigType<TContext>;
  protected _container?: AwilixContainer<BaseDeps & DepsType<TContext>>;
  protected _deps?: BaseDeps & DepsType<TContext>;
  protected _registry?: RegistryType<TContext>;
  protected _logger?: Logger;
  // Admin app is not exposed using the API.  It is available only for registering two routes:
  // "liveness check" and "server shutdown" (and with shutdown, I even question not providing some auth).
  // I'm doing this to discourage developers from building unauthenticated apps on this port.
  // If you want an admin app, use GDAuth; it's simple and provides a layer of security that obscuring another
  // app on an alternate port can't provide.
  protected _adminApp?: Express;
  protected _adminServer?: HttpBasedServer;

  config(factory: ConfigFactoryFn<ConfigType<TContext>>): this {
    this.configFactory = factory;
    return this;
  }

  deps(factory: DepsFactoryFn<BaseConfig & ConfigType<TContext>, DepsType<TContext>>): this {
    this.depsFactory = factory;
    return this;
  }

  registry(factoryOrMap: RegistryType<TContext> | RegistryFn<RegistryType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>>): this {
    this.registryFactory = factoryOrMap;
    return this;
  }

  addPlugins(...plugin: TPlugin[]): this {
    this.plugins.push(...plugin);
    return this;
  }

  protected async getBaseConfig(env: NodeJS.ProcessEnv): Promise<BaseConfig> {
    const extFactories = await this.getAppConfigFactories();
    const factories = [
      baseConfig,
      ...extFactories,
    ];
    return mergeConfigFactories<BaseConfig>(env, factories);
  }

  protected async getPluginConfig(env: NodeJS.ProcessEnv): Promise<Partial<ConfigType<TContext>>> {
    const configs: Array<Partial<ConfigType<TContext>>> = [];
    for (const plugin of this.filterPlugins('config')) {
      const pluginConfig = await plugin.config!(env);
      configs.push(pluginConfig);
    }
    return configs.reduce((acc, pluginConfig) => Object.assign(acc, pluginConfig), {} as Partial<ConfigType<TContext>>);
  }

  protected async getBaseDeps(config: BaseConfig & ConfigType<TContext>): Promise<NameAndRegistrationPair<BaseDeps>> {
    const serverBaseDeps = await getBaseDeps(config);
    let derivedDeps: NameAndRegistrationPair<any> = {};
    for (const extDepsFactory of await this.getAppDepsFactories()) {
      const extDeps = await extDepsFactory(config);
      derivedDeps = {
        ...derivedDeps,
        ...extDeps,
      };
    }
    return {
      ...serverBaseDeps,
      ...derivedDeps,
      // We will leave a handle to the service registry in the dependency tree so that components
      // that need to resolve registry items can get them in a natural way.
      registry: asValue(this.getRegistry()),
    };
  }

  protected filterPlugins(withField: keyof TPlugin): Array<TPlugin> {
    return this.plugins.filter(p => has(p, withField));
  }

  protected async getPluginDeps(config: ConfigType<TContext>): Promise<NameAndRegistrationPair<any>> {
    const deps: Array<NameAndRegistrationPair<any>> = [];
    for (const plugin of this.filterPlugins('deps')) {
      const pluginDeps = await plugin.deps!(config);
      deps.push(pluginDeps);
    }
    return deps.reduce((acc, pluginDeps) => Object.assign(acc, pluginDeps), {} as NameAndRegistrationPair<any>);
  }

  protected getFrameworkRegistry(): Partial<RegistryType<TContext>> {
    return {
      startables: [] as string[],
      stoppables: [] as string[],
      crons: [] as string[],
    } as Partial<RegistryType<TContext>>;
  }

  protected async resolveRegistry(
    factoryOrMap: RegistryType<TContext> | RegistryFn<RegistryType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>>
  ): Promise<Partial<RegistryType<TContext>>> {
    if (typeof factoryOrMap === 'function') {
      const registryFactory = factoryOrMap as RegistryFn<RegistryType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>>;
      return await registryFactory(this._config!, this._container!);
    }
    return factoryOrMap as RegistryType<TContext>;
  }

  protected async getPluginRegistry(): Promise<Partial<RegistryType<TContext>>> {
    const registries: Array<Partial<RegistryType<TContext>>> = [];
    for (const plugin of this.filterPlugins('registry')) {
      // We have to coerce the type because Plugin TRegistry is not the same as this class's.
      const registryOrFactory = plugin.registry! as unknown as
        RegistryType<TContext> | RegistryFn<RegistryType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>>;
      const registry = await this.resolveRegistry(registryOrFactory);
      registries.push(registry);
    }
    return registries.reduce((acc, registry) => Object.assign(acc, registry), {} as Partial<RegistryType<TContext>>);
  }

  protected mergeRegistries(registries: Array<Partial<RegistryType<TContext>>>): RegistryType<TContext> {
    // TypeScript is being really annoying about the types used in a Partial<TRegistry>.
    const empty = (): awilixComponentNames[] => [];
    const mergedRegistry = {
      startables: empty(),
      stoppables: empty(),
      crons: empty(),
    } as RegistryType<TContext>;
    // Opportunity to optimize here -- I went with the most direct implementation and I'm assuming
    // registries will have a small number of entries.  If that's under 100 strings, this should be
    // fine.
    for (const registry of registries) {
      for (const kvp of Object.entries(registry)) {
        const [componentType, componentNames]: [keyof RegistryType<TContext>, awilixComponentNames[]] = kvp;
        if (!mergedRegistry[componentType]) {
          // I need to fallback on "set" here because TS will not allow me to:
          // mergedRegistry[componentType] = empty();
          set(mergedRegistry, componentType, empty());
        }
        for (const componentName of componentNames) {
          if (!mergedRegistry[componentType].includes(componentName)) {
            mergedRegistry[componentType].push(componentName);
          }
        }
      }
    }
    return mergedRegistry as RegistryType<TContext>;
  }

  protected getComponentsByType<T>(componentType: keyof RegistryType<TContext>): Array<T> {
    if (!this._registry![componentType]) {
      throw new BadConfigurationError(`Component Type does not exist in registry: ${componentType}`, { componentType });
    }
    const components: Array<T> = [];
    for (const dependencyName of this._registry![componentType]) {
      if (!this._container?.has(dependencyName)) {
        throw new Error(`Component ${dependencyName} does not exist in the dependency graph.`);
      }
      components.push(this._container?.resolve(dependencyName));
    }
    return components;
  }

  protected getRegistry(): Registry<RegistryType<TContext>> {
    return {
      getAll: this.getComponentsByType.bind(this),
    };
  }

  protected validatedRegistry(): void | never {
    const components = Object
      .values(this._registry || {})
      .reduce((acc, aryOfComponentNames) => acc.concat(aryOfComponentNames), [] as awilixComponentNames[]);
    const missingComponents = components.filter(c => !this._container!.has(c));
    if (missingComponents.length > 0) {
      this._logger?.error({ missingComponents }, 'Registry components not found in dependency graph.');
      throw new Error(`Missing components in Dependency Graph: ${missingComponents}`);
    }
  }

  /**
   * Open for extension by derived apps.  Generally, we only need a bare Admin server.
   * @param config
   * @protected
   */
  protected createAdminExpressApp(config: WebServerConfig): Express {
    const app = express();
    app.use([express.json(), express.urlencoded({ extended: true })]);
    return app;
  }

  protected async createServer(app: Express, config: WebServerConfig): Promise<HttpBasedServer> {
    return await new Promise<HttpBasedServer>((resolve, reject) => {
      const options = { handler: app };
      if (config.protocol === HttpProtocols.HTTPS) {
        Object.assign(options, { https: { ...config.tls, port: config.port } });
      } else {
        Object.assign(options, { http: { port: config.port } });
      }
      createServers(options, (errors, servers) => {
        if (errors && errors.message) {
          return reject(new InternalError(config.protocol === HttpProtocols.HTTPS ? errors.https : errors.http));
        }
        if (!servers || !(servers.http || servers.https)) {
          return reject(new InternalError('No server returned from create servers.'));
        }
        return resolve((config.protocol === HttpProtocols.HTTPS ? servers.https! : servers.http!) as HttpBasedServer);
      });
    });
  }

  protected async evaluateServerHealth(): Promise<ServiceHealthResult> {
    const healthCheckService = this._container!.resolve<HealthCheckService>('healthCheckService');
    const result = await healthCheckService.runHealthChecks();
    if (result.status === ServiceHealthStatuses.Unhealthy) {
      throw new ServiceUnavailableError('Service', 'Server Failed Health Check.', result);
    }
    return result;
  }

  protected setupShutdownHooks(): void {
    const evaluateServiceHealth = this.evaluateServerHealth.bind(this);
    createTerminus(this._adminServer, {
      healthChecks: {
        '/healthz': evaluateServiceHealth,
        verbatim: true,
        // OK because it's on the admin port.
        __unsafeExposeStackTraces: true,
      },
      caseInsensitive: false,
      statusOk: 200,
      statusError: 503,
      timeout: this._config?.shutdownGracePeriod,
      beforeShutdown: async () => {
        this._logger?.info('Shutdown signal received.  Stopping server.');
        await this.stop(false);
      },
      onSignal: async () => {
        this._logger?.trace('onSignal');
      },
      onShutdown: async () => {
        this._logger?.trace('onShutdown');
      },
      logger: (message, error) => this._logger!.error(formatError(error), message),
    });
  }

  protected async startServers(): Promise<void> {
    try {
      this._adminServer = await this.createServer(this._adminApp!, this._config!.adminHttp);
      this.setupShutdownHooks();
      await this.startAppServers();
    } catch (error) {
      this._logger!.error(formatError(error), 'An error occurred creating servers.');
      if (error.code) {
        throw error;
      }
      throw new InternalError(error);
    }
  }

  protected async start(): Promise<void> {
    const startables = this.getComponentsByType<Startable>('startables');
    try {
      for (const startable of startables) {
        if (!startable.start) {
          throw new BadConfigurationError(`Component is not startable`, { startable });
        }
        await startable.start();
      }
    } catch (error) {
      this._logger?.error(formatError(error), 'An error occurred starting a component.');
      // Any failure to start a component should cascade and terminate the server.
      throw error;
    }

    try {
      await this.startServers();
    } catch (error) {
      this._logger?.error(formatError(error), 'An error occurred starting servers.');
      // Any failure to start a server should cascade and terminate the server.
      throw error;
    }
  }

  protected async closeServer(server: HttpBasedServer | undefined, serverName: string): Promise<void> {
    if (server && server.listening) {
      await new Promise<void>((resolve) => {
        server!.close((error) => {
          if (error) {
            this._logger?.error(formatError(error), `An error occurred stopping the ${serverName}.`);
          }
          return resolve();
        });
      });
    }
  }

  protected async stopComponents(): Promise<void> {
    const stoppables = this.getComponentsByType<Stoppable>('stoppables');
    for (const stoppable of stoppables) {
      if (!stoppable.stop) {
        this._logger?.warn({ stoppable }, 'Component is not stoppable');
      }
      // We need to try to stop all components.  Failure of one should not prevent
      // the stopping of others.
      try {
        await stoppable.stop();
      } catch (error) {
        this._logger?.error(formatError(error), 'Failed to stop component.');
      }
    }
  }

  protected async stop(closeAdminServer = true): Promise<void> {

    this._logger?.trace('Stopping app servers.');

    try {
      await this.stopAppServers();
    } catch (error) {
      this._logger?.error(formatError(error), 'An error occurred stopping application servers.');
    }
    // Using terminus, the admin server will automatically be shutdown on SIGTERM.  If it's in the process
    // of closing, we don't want to try closing it again.
    if (closeAdminServer) {

      this._logger?.trace('Manually closing the admin server (not a terminus shutdown).');

      try {
        await this.closeServer(this._adminServer, 'Admin Server');
      } catch (error) {
        this._logger?.error(formatError(error), 'An error occurred stopping servers.');
      }
    }

    this._logger?.trace('Stopping components.');

    await this.stopComponents();
  }

  protected createContext(): ServiceContext<BaseConfig & ConfigType<TContext>, BaseDeps & DepsType<TContext>, RegistryType<TContext>> {
    return {
      config: this._config!,
      deps: this._container!.cradle,
      container: this._container!,
      registry: this.getRegistry(),
    };
  }

  async initialize(options: InitializeOptions = {}): Promise<ServiceOperator<ConfigType<TContext>, DepsType<TContext>, RegistryType<TContext>>> {
    const env = options.env || process.env;

    // render base config
    const baseConfig = await this.getBaseConfig(env);
    const pluginConfig = await this.getPluginConfig(env);
    const appConfig = this.configFactory ? await this.configFactory(env) : {};

    this._config = {
      ...baseConfig,
      ...pluginConfig,
      ...appConfig,
    } as BaseConfig & ConfigType<TContext>;

    const baseDeps = await this.getBaseDeps(this._config!);
    const pluginDeps = await this.getPluginDeps(this._config!);
    const appDeps = this.depsFactory ? await this.depsFactory(this._config!) : {};

    const mergedDeps = {
      ...baseDeps,
      ...pluginDeps,
      ...appDeps,
    } as NameAndRegistrationPair<BaseDeps & DepsType<TContext>>;

    this._container = createContainer<BaseDeps & DepsType<TContext>>({ injectionMode: 'CLASSIC' }).register(mergedDeps);
    this._deps = this._container.cradle;

    this._logger = this._container.resolve<Logger>('logger').child({
      component: 'Service<T>',
    });

    this._logger.trace('Configuration, Deps, and Logger initialized. Getting framework registrants.');

    const frameworkRegistry = this.getFrameworkRegistry();
    const pluginRegistry = await this.getPluginRegistry();

    this._logger.trace('Loading app registry.');

    const appRegistry = this.registryFactory ? await this.resolveRegistry(this.registryFactory) : {};

    this._logger.trace('Merging registries.');

    this._registry = this.mergeRegistries([frameworkRegistry, pluginRegistry, appRegistry]);

    this._logger.trace('Validating registry.');

    // Ensure every registered component in the registry is defined in the Awilix Container.
    this.validatedRegistry();

    this._logger.trace('Initializing admin HTTP server.');

    this._adminApp = this.createAdminExpressApp(this._config!.adminHttp);

    this._logger.trace('Initialize app configuration.');

    const ctx = await this.initializeApp(this.createContext());

    this._logger.trace('Initialization complete. Returning handle to caller.');

    return {
      ...ctx,
      start: this.start.bind(this),
      stop: this.stop.bind(this),
    };
  }

  /// FRAMEWORK EXTENSION POINTS ///

  /**
   * Supply an array of config factories that will supplement base configuration factories in creating
   * the derived config for a server.
   * @protected
   */
  protected async getAppConfigFactories(): Promise<Array<ConfigFactoryFn<Partial<BaseConfig & ConfigType<TContext>>>>> {
    return [];
  }

  /**
   * Supply an array of dependency factories that will supplement the base dependency tree in creating
   * the derived dependency tree for a server.
   * @protected
   */
  protected async getAppDepsFactories(): Promise<Array<DepsFactoryFn<BaseConfig & ConfigType<TContext>, DepsType<TContext>>>> {
    return [];
  }

  /**
   * Called in the lifecycle.  Since ServiceTemplate is not abstract, we supply a default (empty) version
   * of this method.  Derivative classes of ServiceTemplate should override this method to bootstrap their
   * own servers as needed.
   * @protected
   */
  protected async startAppServers(): Promise<void> {
    this._logger?.trace('Start App Servers');
  }

  /**
   * Hook for stopping application servers started in derived classes.
   * @protected
   */
  protected async stopAppServers(): Promise<void> {
    this._logger?.trace('Stop App Servers');
  }

  /**
   * * Hook to allow framework developers to initialize Applications at the correct time in the service's lifecycle.
   * @param context ServiceContext (not the actual TContext
   * @returns extended context conforming to type TContext.  This means, if you add properties to the context, do it here.
   * @protected
   */
  protected async initializeApp(context: ServiceContext<BaseConfig & ConfigType<TContext>, BaseDeps & DepsType<TContext>, RegistryType<TContext>>): Promise<TContext> {
    return context as TContext;
  }
}
