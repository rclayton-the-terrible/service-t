import {
  ConfigType,
  CustomizeAppFn, CustomRouterFn,
  DangerZone,
  DepsType,
  Handler,
  Methods, Middleware,
  RegistryType,
  Route,
  ScopedDepsType,
  ScopeDepsFn,
  WebContext,
  WebPlugin,
  Webserver
} from './model/Webserver';
import { ServiceContext } from '@service-t/core/dist/model/Service';
import { BaseConfig } from '@service-t/core/dist/config/BaseConfig';
import { BaseDeps } from '@service-t/core/dist/deps/BaseDeps';
import { HttpBasedServer } from '@service-t/core/dist/model/HttpBasedServer';
import { NameAndRegistrationPair } from 'awilix';
import { BaseWebConfig } from './config/BaseWebConfig';
import { IRouterMatcher } from 'express-serve-static-core';
import { isFunction } from 'lodash';

import Service from '@service-t/core/dist/Service';

import express, { Express, RequestHandler, Request, Router, IRouter } from 'express';
import errorBoundary from './middleware/errorBoundary';
import formatError from '@service-t/api/dist/errors/formatError';

type ManagedRouterFns = 'all'| 'use'| 'get'| 'put'| 'post'| 'delete'| 'patch'| 'options'|
    'checkout'| 'connect'| 'head'| 'copy'| 'lock'| 'merge'| 'mkactivity'| 'mkcol'| 'move'| 'm-search'| 'notify'|
    'propfind'| 'proppatch'| 'purge'| 'report'| 'search'| 'subscribe'| 'trace'| 'unlock'| 'unsubscribe';

const MANAGED_ROUTER_FNS: Array<keyof IRouter> = [
  'all', 'use', 'get', 'put', 'post', 'delete', 'patch', 'options',
  'checkout', 'connect', 'head', 'copy', 'lock', 'merge', 'mkactivity', 'mkcol', 'move', 'm-search', 'notify',
  'propfind', 'proppatch', 'purge', 'report', 'search', 'subscribe', 'trace', 'unlock', 'unsubscribe',
];

export default class WebserverTemplate<TContext extends WebContext>
  extends Service<TContext, WebPlugin>
  implements Webserver<TContext, WebPlugin> {

    protected scopedDepsFactory?: ScopeDepsFn<ScopedDepsType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & BaseWebConfig & ConfigType<TContext>, RegistryType<TContext>>;

    // These are Danger Zone functions.  They mutate app directly outside of the default router.
    protected middlewareFactory?: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & BaseWebConfig & ConfigType<TContext>, RegistryType<TContext>>;
    protected routeFactory?: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & BaseWebConfig & ConfigType<TContext>, RegistryType<TContext>>;
    protected errorMiddlewareFactory?: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & BaseWebConfig & ConfigType<TContext>, RegistryType<TContext>>;

    // These are managed handlers that are wrapped in error boundaries.
    protected managedMiddleware: Array<Middleware> = [];
    protected managedRoutes: Array<Route> = [];
    protected managedRouters: Array<CustomRouterFn<ConfigType<TContext>, DepsType<TContext>, RegistryType<TContext>, ScopedDepsType<TContext>>> = [];

    protected _app?: Express;
    protected _appServer?: HttpBasedServer;

    scopedDeps(factory: ScopeDepsFn<ScopedDepsType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & BaseWebConfig & ConfigType<TContext>, RegistryType<TContext>>): this {
      this.scopedDepsFactory = factory;
      return this;
    }

    // TODO: Dynamic registration of deps
    protected wrapHandler(handler: Handler): RequestHandler {
      return (req, res, next) => {
        const deps = res.locals.deps;
        return errorBoundary(
          (req1, res1, next1) =>
            handler(req1, res1, next1, deps))(req, res, next);
      };
    }

    protected createWebContext(): WebContext<
        BaseConfig & BaseWebConfig & ConfigType<TContext>,
        BaseDeps & DepsType<TContext> & ScopedDepsType<TContext>,
        RegistryType<TContext>
        > {
      return {
        ...this.createContext() as TContext,
        app: this._app!,
      };
    }

    protected async buildScopedDepsGraph(
      req: Request,
    ): Promise<NameAndRegistrationPair<any>> {
      const ctx = this.createWebContext();
      const deps: Array<NameAndRegistrationPair<any>> = [];
      const pluginScopedDeps = await Promise.all(
        this.filterPlugins('scopedDeps').map(async (plugin) => {
          try {
            return await plugin.scopedDeps!(req, ctx);
          } catch (error) {
                    this._logger!.error(
                      { ...formatError(error), name: plugin.name },
                      'An error occurred getting scoped deps for plugin'
                    );
                    throw error;
          }
        }),
      );
      deps.push(...pluginScopedDeps);
      if (this.scopedDepsFactory) {
        const appScopedDeps = await this.scopedDepsFactory(req, ctx);
        deps.push(appScopedDeps);
      }
      return deps.reduce((acc, partialDeps) => Object.assign(acc, partialDeps), {} as NameAndRegistrationPair<any>);
    }


    /**
     * Middleware that binds scoped dependencies to the request.
     * @protected
     */
    protected scopeDepsMiddleware(): RequestHandler {
      return async (req, res, next) => {
        const scopedDeps = await this.buildScopedDepsGraph(req);
        res.locals.deps = this._container?.createScope().register(scopedDeps).cradle;
        next();
      };
    }

    use(...middleware: Middleware[]): this {
      this.managedMiddleware.push(...middleware);
      return this;
    }

    route(...routes: Route[]): this {
      this.managedRoutes.push(...routes);
      return this;
    }

    addRouter(...routers: CustomRouterFn<ConfigType<TContext>, DepsType<TContext>, RegistryType<TContext>, ScopedDepsType<TContext>>[]): this {

      return this;
    }

    get dangerZone(): DangerZone<ConfigType<TContext>, DepsType<TContext>, RegistryType<TContext>, ScopedDepsType<TContext>> {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const me = this;
      return {
        setAppMiddleware: (
          customize: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & BaseWebConfig & ConfigType<TContext>, RegistryType<TContext>>
        ): Webserver<TContext, WebPlugin> => {
          this.middlewareFactory = customize;
          return me;
        },
        setAppRoutes: (
          customize: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & BaseWebConfig & ConfigType<TContext>, RegistryType<TContext>>
        ): Webserver<TContext, WebPlugin> => {
          this.routeFactory = customize;
          return me;
        },
        setAppErrorMiddleware: (
          customize: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & BaseWebConfig & ConfigType<TContext>, RegistryType<TContext>>
        ): Webserver<TContext, WebPlugin> => {
          this.errorMiddlewareFactory = customize;
          return me;
        }
      };
    }

    protected async startAppServers(): Promise<void> {
      this._appServer = await this.createServer(this._app!, this._config!.http!);
    }

    protected async stopAppServers(): Promise<void> {
      await this.closeServer(this._appServer, 'App Server');
    }

    protected createExpressApp(): Express {
      this._app = express();
      if (this._config!.enabled?.removePoweredBy) {
        this._app.disable('x-powered-by');
      }
      if (this._config!.enabled?.trustProxy) {
        this._app.set('trust proxy', 1);
      }
      if (this._config!.enabled?.compression) {
        this._app.use(this._deps!['middleware.compression']);
      }
      this._app.use(this._deps!['middleware.requestParsers']);
      this._app.use(this.scopeDepsMiddleware());

      return this._app;
    }

    protected async initializeApp(): Promise<TContext> {

      // Use aliases because it makes life easier.
      const logger = this._logger!;
      const app = this.createExpressApp();
      const ctx = this.createWebContext();

      logger.trace('Invoking middleware factories.');

      const defaultRouter = this.createProxyRouter();

      const middlewareFactories = [
        ...this.filterPlugins('middleware').map(p => p.middleware),
        this.errorMiddlewareFactory,
      ].filter(Boolean); // filters falsy values.

      for (const middlewareFactory of middlewareFactories) {
        await middlewareFactory!(app, ctx);
      }

      logger.trace('Binding managed middleware to Express.');

      for (const middleware of this.managedMiddleware) {
        if (middleware.paths) {
          defaultRouter.use(middleware.paths, middleware.handlers as RequestHandler);
        } else {
          defaultRouter.use(middleware.handlers as RequestHandler);
        }
      }

      logger.trace('Registering framework routes.');

      // TODO: Framework routes
      logger.trace('Invoking route factories.');

      const routeFactories = [
        ...this.filterPlugins('routes').map(p => p.routes),
        this.routeFactory,
      ].filter(Boolean); // filters falsy values.

      for (const routeFactory of routeFactories) {
        await routeFactory!(app, ctx);
      }

      logger.trace('Binding managed routes to Express.');

      for (const route of this.managedRoutes) {
        defaultRouter[route.method as ManagedRouterFns](route.paths, route.handlers as RequestHandler);
      }

      logger.trace('Registering routers.');

        this._app!.use(defaultRouter);

        for (const routerFn of this.managedRouters) {
          const router = this.createProxyRouter();
          await routerFn(this.createProxyRouter(), ctx as TContext);
            this._app!.use(router);
        }

        logger.trace('Invoking error middleware factories.');

        const errorMiddlewareFactories = [
          this.errorMiddlewareFactory,
          ...this.filterPlugins('errorMiddleware').map(p => p.errorMiddleware),
        ].filter(Boolean);

        for (const errorMiddlewareFactory of errorMiddlewareFactories) {
          await this.errorMiddlewareFactory!(app, ctx);
        }

        return ctx as TContext;
    }

    protected createProxyRouter(): IRouter {
      const router = Router();
      return new Proxy(router, {
        get: (target, property: keyof IRouter) => {
          if (MANAGED_ROUTER_FNS.includes(property)) {
            const matcherFn = target[property] as IRouterMatcher<IRouter>;
            return new Proxy(matcherFn, {
              apply: (target: IRouterMatcher<IRouter>, thisArg: any, argArray: any[]): any => {
                const wrappedArgs = [];
                for (const arg of argArray) {
                  if (Array.isArray(arg)) {
                    const wrappedArrayArg = [];
                    for (const a of argArray as Array<any>) {
                      wrappedArrayArg.push(isFunction(a) ? this.wrapHandler(a) : a);
                    }
                    wrappedArgs.push(wrappedArrayArg);
                  } else {
                    wrappedArgs.push(isFunction(arg) ? this.wrapHandler(arg) : arg);
                  }
                }
              }
            });
          }
          return target[property];
        }
      });
    }
}
