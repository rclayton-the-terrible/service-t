import { NameAndRegistrationPair } from 'awilix';
import { BaseConfig } from '@service-t/core/dist/config/BaseConfig';
import { BaseDeps } from '@service-t/core/dist/deps/BaseDeps';
import { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import { Service, ServiceContext, ServicePlugin, RegistryMap } from '@service-t/core/dist/model/Service';

export type GObject = Record<string, unknown>;

export interface WebContext<
  TConfig extends GObject = any,
  TDeps extends GObject = any,
  TRegistry extends RegistryMap = RegistryMap
  > extends ServiceContext<TConfig, TDeps, TRegistry> {
  app: Express,
}

export type ScopeDepsFn<
  TScopedDeps extends GObject = GObject,
  TDeps extends GObject = GObject,
  TConfig extends BaseConfig = BaseConfig,
  TRegistry extends RegistryMap = RegistryMap
  > = (req: Request, ctx: WebContext<BaseConfig & TConfig, BaseDeps & TDeps, TRegistry>) => Promise<NameAndRegistrationPair<TScopedDeps>>;

export type CustomizeAppFn<
  TDeps extends BaseDeps = BaseDeps,
  TConfig extends BaseConfig = BaseConfig,
  TRegistry extends RegistryMap = RegistryMap
  > = (app: Express, ctx: WebContext<BaseConfig & TConfig, BaseDeps & TDeps, TRegistry>) => Promise<void>;

export type InjectedHandler<
  TDeps extends BaseDeps = BaseDeps,
  > = (req: Request, res: Response, next: NextFunction, deps: TDeps) => any;

export type Handler = InjectedHandler | RequestHandler;
export type Methods = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export interface DangerZone<
  TConfig extends GObject,
  TDeps extends GObject,
  TRegistry extends RegistryMap = RegistryMap,
  TScopedDeps extends GObject = GObject
  > {
  /**
   * Add middleware to the application after framework middleware but before routes are added.
   *
   * This should NOT be called more than once.
   *
   * @param customize
   */
  setAppMiddleware(customize: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & TConfig, TRegistry>): Webserver<TConfig, TDeps, TRegistry, TScopedDeps>,

  /**
   * Register routes with the framework.  This approach gives you access to `app` and the WebContext.
   * Alternatively, you can just register routes using `addRoute`.
   *
   * This should NOT be called more than once.
   *
   * @param customize
   */
  setAppRoutes(customize: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & TConfig, TRegistry>): Webserver<TConfig, TDeps, TRegistry, TScopedDeps>,

  /**
   * Register error handling middleware.  Please be careful here.  Webserver already supplies error mapping
   * middleware which conforms to our API response specification.
   *
   * This should NOT be called more than once.
   *
   * @param customize
   */
  setAppErrorMiddleware(customize: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & TConfig, TRegistry>): Webserver<TConfig, TDeps, TRegistry, TScopedDeps>,
}

export type Route<TMethod extends Methods = any> = {
  method: TMethod,
  paths: string | string[],
  handlers: Handler | Array<Handler>
}

/**
 * Mechanism to package a set of coherent functionality for registration with a Webserver.
 */
export interface WebPlugin<
  TConfig extends GObject = any,
  TDeps extends GObject = any,
  TRegistry extends RegistryMap = RegistryMap,
  TScopedDeps extends GObject = GObject
  > extends ServicePlugin<TConfig, TDeps, TRegistry> {
  scopedDeps?: ScopeDepsFn<TScopedDeps, TDeps, BaseConfig & TConfig>,
  middleware?: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & TConfig, TRegistry>,
  routes?: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & TConfig, TRegistry>,
  errorMiddleware?: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & TConfig, TRegistry>,
}

/**
 * Primary interface for building a Webserver.
 */
export interface Webserver<
  TConfig extends GObject,
  TDeps extends GObject,
  TRegistry extends RegistryMap = RegistryMap,
  TScopedDeps extends GObject = GObject
  > extends Service<WebContext<TConfig, TDeps, TRegistry>> {
  /**
   * Optional: Provide a factory that will supply scoped dependencies for each request.
   * @param factory
   */
  scopedDeps(factory: ScopeDepsFn<TScopedDeps, TDeps, BaseConfig & TConfig>): this,

  /**
   * Take control of Express and add middleware, routes, etc.  By doing this, we assume you know
   * what you are doing and don't want any of the goodness provided by Webserver<T>.
   */
  dangerZone: DangerZone<TConfig, TDeps, TRegistry, TScopedDeps>

  /**
   * Official way to add managed middleware.  This wraps middleware in an error boundary.
   *
   * This MAY be called as many times as you like.
   *
   * @param paths
   * @param handlers
   */
  use(paths?: string | string[], ...handlers: Array<Handler>): this

  /**
   * Official way to add managed routes.  This gives you access to request-scope dependencies, error
   * boundaries, and automatic metrics+tracing.
   *
   * This MAY be called as many times as you like.
   *
   * @param method
   * @param paths
   * @param handlers
   */
  route<
    TMethod extends Methods = any
    >(method: TMethod, paths: string | string[], ...handlers: Array<Handler>): this
}
