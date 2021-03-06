import { NameAndRegistrationPair } from 'awilix';
import { BaseConfig } from '@service-t/core/dist/config/BaseConfig';
import { BaseWebConfig } from '../config/BaseWebConfig';
import { BaseDeps } from '@service-t/core/dist/deps/BaseDeps';
import { Express, Request, Response, NextFunction, RequestHandler, IRouter } from 'express';
import { Service, ServiceContext, ServicePlugin, RegistryMap } from '@service-t/core/dist/model/Service';
import { SomeObject } from '@service-t/api/dist/SomeObject';

export interface WebContext<
  TConfig extends SomeObject = any,
  TDeps extends SomeObject = any,
  TRegistry extends RegistryMap = RegistryMap,
  TScopedDeps extends SomeObject = any,
  > extends ServiceContext<TConfig, TDeps & TScopedDeps, TRegistry> {
  app: Express,
}

export type ScopeDepsFn<
  TScopedDeps extends SomeObject = SomeObject,
  TDeps extends SomeObject = SomeObject,
  TConfig extends BaseConfig = BaseConfig,
  TRegistry extends RegistryMap = RegistryMap
  > = (req: Request, ctx: WebContext<BaseConfig & BaseWebConfig & TConfig, BaseDeps & TDeps, TRegistry>) => Promise<NameAndRegistrationPair<TScopedDeps>>;

export type CustomizeAppFn<
  TDeps extends BaseDeps = BaseDeps,
  TConfig extends BaseConfig = BaseConfig,
  TRegistry extends RegistryMap = RegistryMap
  > = (app: Express, ctx: WebContext<BaseConfig & BaseWebConfig & TConfig, BaseDeps & TDeps, TRegistry>) => Promise<void>;

export type InjectedHandler<
  TDeps extends BaseDeps = BaseDeps,
  > = (req: Request, res: Response, next: NextFunction, deps: TDeps) => any;

export type Methods = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export type CustomRouterFn<
  TDeps extends BaseDeps = BaseDeps,
  TConfig extends BaseConfig = BaseConfig,
  TRegistry extends RegistryMap = RegistryMap,
  TScopedDeps extends SomeObject = any
  > = (router: IRouter, ctx: WebContext<BaseConfig & BaseWebConfig & TConfig, BaseDeps & TDeps, TRegistry, TScopedDeps>) => Promise<void>;

export interface DangerZone<
  TConfig extends SomeObject,
  TDeps extends SomeObject,
  TRegistry extends RegistryMap = RegistryMap,
  TScopedDeps extends SomeObject = SomeObject
  > {
  /**
   * Add middleware to the application after framework middleware but before routes are added.
   *
   * This should NOT be called more than once.
   *
   * @param customize
   */
  setAppMiddleware(
      customize: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & BaseWebConfig & TConfig, TRegistry>
  ): Webserver<WebContext<TConfig, TDeps, TRegistry, TScopedDeps>, WebPlugin>,

  /**
   * Register routes with the framework.  This approach gives you access to `app` and the WebContext.
   * Alternatively, you can just register routes using `addRoute`.
   *
   * This should NOT be called more than once.
   *
   * @param customize
   */
  setAppRoutes(
      customize: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & BaseWebConfig & TConfig, TRegistry>
  ): Webserver<WebContext<TConfig, TDeps, TRegistry, TScopedDeps>, WebPlugin>,

  /**
   * Register error handling middleware.  Please be careful here.  Webserver already supplies error mapping
   * middleware which conforms to our API response specification.
   *
   * This should NOT be called more than once.
   *
   * @param customize
   */
  setAppErrorMiddleware(
      customize: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & BaseWebConfig & TConfig, TRegistry>
  ): Webserver<WebContext<TConfig, TDeps, TRegistry, TScopedDeps>, WebPlugin>,
}

export type Middleware<TDeps extends BaseDeps = BaseDeps> = {
  paths?: string | string[],
  handlers: InjectedHandler<TDeps> | Array<InjectedHandler<TDeps>>
}

export type Route<TDeps extends BaseDeps = BaseDeps, TMethod extends Methods = any> = {
  method: TMethod,
  paths: string | string[],
  handlers: InjectedHandler<TDeps> | Array<InjectedHandler<TDeps>>
}

/**
 * Mechanism to package a set of coherent functionality for registration with a Webserver.
 */
export interface WebPlugin<
  TConfig extends SomeObject = any,
  TDeps extends SomeObject = any,
  TRegistry extends RegistryMap = RegistryMap,
  TScopedDeps extends SomeObject = SomeObject
  > extends ServicePlugin<TConfig, TDeps, TRegistry> {
  scopedDeps?: ScopeDepsFn<TScopedDeps, TDeps, BaseConfig & BaseWebConfig & TConfig>,
  middleware?: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & BaseWebConfig & TConfig, TRegistry>,
  routes?: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & BaseWebConfig & TConfig, TRegistry>,
  errorMiddleware?: CustomizeAppFn<BaseDeps & TDeps, BaseConfig & BaseWebConfig & TConfig, TRegistry>,
}

export type ConfigType<TConfig> = TConfig extends WebContext<infer T, any, any> ? T : never;
export type DepsType<TDeps> = TDeps extends WebContext<any, infer T, any> ? T : never;
export type RegistryType<TRegistry> = TRegistry extends WebContext<any, any, infer T> ? T : never;
export type ScopedDepsType<TScopedDeps> = TScopedDeps extends WebContext<any, any, any, infer T> ? T : never;

/**
 * Primary interface for building a Webserver.
 */
export interface Webserver<
    TContext extends WebContext,
    TPlugin extends WebPlugin<any, any, any, any>
  > extends Service<TContext, TPlugin> {
  /**
   * Optional: Provide a factory that will supply scoped dependencies for each request.
   * @param factory
   */
  scopedDeps(factory: ScopeDepsFn<ScopedDepsType<TContext>, DepsType<TContext>, BaseConfig & ConfigType<TContext>>): this,

  /**
   * Take control of Express and add middleware, routes, etc.  By doing this, we assume you know
   * what you are doing and don't want any of the goodness provided by Webserver<T>.
   */
  dangerZone: DangerZone<ConfigType<TContext>, DepsType<TContext>, RegistryType<TContext>, ScopedDepsType<TContext>>

  /**
   * Official way to add managed middleware.  This wraps middleware in an error boundary.
   *
   * Note: this method binds all middleware to the "Default" router.  If you want a different behavior,
   * use addRouter.
   *
   * This MAY be called as many times as you like.
   *
   * @param middleware
   */
  use(...middleware: Middleware[]): this,

  /**
   * Official way to add managed routes.  This gives you access to request-scope dependencies, error
   * boundaries, and automatic metrics+tracing.
   *
   * Note: this method binds all routes to the "Default" router.  If you want a different behavior,
   * use addRouter.
   *
   * This MAY be called as many times as you like.
   *
   * @param routes
   */
  route(...routes: Route[]): this,

  /**
   * Add a set of managed routes using an Express router.  This implementation will automatically wrap middleware
   * and handlers with the appropriate middleware and injector functions.
   *
   * This MAY be called as many times as you like.
   *
   * @param routers
   */
  addRouter(...routers: CustomRouterFn[]): this,
}
