import { AwilixContainer, NameAndRegistrationPair } from 'awilix';
import { BaseConfig } from '../config/BaseConfig';
import { BaseDeps } from '../deps/BaseDeps';
import { SomeObject } from '@service-t/api/dist/SomeObject';

export type awilixComponentNames = string;

/**
 * The dependency injection system at the core of Service<T> (Awilix) does not support operations
 * to resolve multiple components at a time.  This means we can't ask for all components that start
 * with a specific prefix, or have some tag.  This is a limitation that affects the way Service<T> can
 * provide essential functionality (like pulling all startable and stoppable components from the
 * registry).  To get around this, Service<T> has this concept of "The Registry".
 *
 * The Registry is simply a map of interface name to Awilix component that implement the interface.
 * The server uses the registry to resolve all components in the dependency tree.  The registry
 * is open for app developers to also use, however, it's not essential.  You can achieve the same
 * functionality in by using a custom resolver in Awilix.  Service<T> can't do this because it has
 * to compose multiple registries (base registry, plugins, app) at runtime.
 */
export type RegistryMap = {
  /**
   * Components that start BEFORE the application servers come online.
   */
  startables: awilixComponentNames[],
  /**
   * Components that stop AFTER the applications services shutdown.
   */
  stoppables: awilixComponentNames[],
  /**
   * Components that implement the CronJob interface and registered IN-PROCESS (not distributed)
   * jobs.
   */
  crons: awilixComponentNames[],
  /**
   * Components that are evaluated for health when health checks are evaluated.
   */
  checks: awilixComponentNames[],
  /**
   * App/Developer defined components that are registered as collections.
   */
  [interfaceName: string]: awilixComponentNames[],
}

/**
 * Get all
 */
export interface Registry<TRegistry extends RegistryMap = RegistryMap> {
  getAll<T>(componentType: keyof TRegistry): Array<T>
}

export interface ServiceContext<
  TConfig extends SomeObject = any,
  TDeps extends SomeObject = any,
  TRegistry extends RegistryMap = RegistryMap
  > {
  config: TConfig,
  container: AwilixContainer<TDeps>,
  deps: TDeps,
  registry: Registry<TRegistry>,
}

export interface ServiceOperator<
  TConfig extends SomeObject,
  TDeps extends SomeObject,
  TRegistry extends RegistryMap
  > extends ServiceContext<BaseConfig & TConfig, BaseDeps & TDeps, TRegistry> {
  start(): Promise<void>
  stop(): Promise<void>
}

export type ConfigFactoryFn<
  TConfig extends SomeObject = SomeObject
  > = (env: NodeJS.ProcessEnv) => Promise<TConfig>;

export type DepsFactoryFn<
  TConfig extends BaseConfig = BaseConfig,
  TDeps extends SomeObject = SomeObject
  > = (config: TConfig) => Promise<NameAndRegistrationPair<TDeps>>;

export type RegistryFn<
  TRegistry extends RegistryMap = RegistryMap,
  TDeps extends BaseDeps = BaseDeps,
  TConfig extends BaseConfig = BaseConfig
  > = (config: TConfig, container: AwilixContainer<TDeps>) => Promise<Partial<TRegistry>>;

export type InitializeOptions = {
  env?: NodeJS.ProcessEnv,
}


/**
 * Mechanism to package a set of coherent functionality for registration with a service
 */
export interface ServicePlugin<
  TConfig extends SomeObject = any,
  TDeps extends SomeObject = any,
  TRegistry extends RegistryMap = RegistryMap
  > {
  /**
   * Name of the plugin, used for debugging purposes.
   */
  name: string,
  config?: ConfigFactoryFn<TConfig>,
  deps?: DepsFactoryFn<BaseConfig & TConfig, TDeps>,
  registry?: TRegistry | RegistryFn<TRegistry, BaseDeps & TDeps, BaseConfig & TConfig>,
}

type ConfigType<TConfig> = TConfig extends ServiceContext<infer T, any, any> ? T : never;
type DepsType<TDeps> = TDeps extends ServiceContext<any, infer T, any> ? T : never;
type RegistryType<TRegistry> = TRegistry extends ServiceContext<any, any, infer T> ? T : never;

/**
 * Primary interface for building a server.
 */
export interface Service<
    TServiceContext extends ServiceContext,
    TPlugin extends ServicePlugin<any, any>
> {

  /**
   * REQUIRED: Configure the application by supplying a configuration factory.
   * @param factory
   */
  config(factory: ConfigFactoryFn<ConfigType<TServiceContext>>): this,

  /**
   * REQUIRED: Provide application dependencies by supplying a deps factory.
   * @param factory
   */
  deps(factory: DepsFactoryFn<BaseConfig & ConfigType<TServiceContext>, DepsType<TServiceContext>>): this,

  /**
   * Add a plugin to the server.
   * @param plugins
   */
  addPlugins(...plugins: TPlugin[]): this,

  /**
   * This is a map of component-type to array of Awilix component names.
   * We need this because TypeScript "types" don't exist at runtime.  So if we want to
   * grab all components that implement a specific interface, we have to register them
   * ahead of time.
   * @param factoryOrMap
   */
  registry(factoryOrMap: RegistryType<TServiceContext> | RegistryFn<RegistryType<TServiceContext>, BaseDeps & DepsType<TServiceContext>, BaseConfig & ConfigType<TServiceContext>>): this,

  /**
   * Initialize the server.  This includes any async calls used to pull configuration, etc.
   * Registered by the user.  It does not involve starting "startable" components.
   * @param options
   */
  initialize(options?: InitializeOptions): Promise<ServiceOperator<ConfigType<TServiceContext>, DepsType<TServiceContext>, RegistryType<TServiceContext>>>
}

