import {
    ConfigType,
    CustomizeAppFn,
    DangerZone, DepsType,
    Handler,
    Methods, RegistryType, ScopedDepsType,
    ScopeDepsFn,
    WebContext,
    WebPlugin,
    Webserver
} from "./model/Webserver";
import {Registry, RegistryMap} from "@service-t/core/dist/model/Service";
import {BaseConfig} from "@service-t/core/dist/config/BaseConfig";
import {BaseDeps} from "@service-t/core/dist/deps/BaseDeps";
import {HttpBasedServer} from "@service-t/core/dist/model/HttpBasedServer";
import {Express, RequestHandler, Request} from 'express';
import {NameAndRegistrationPair} from "awilix";

import Service from "@service-t/core/dist/Service";

import errorBoundary from "./middleware/errorBoundary";
import formatError from "@service-t/api/dist/errors/formatError";


export default class WebserverTemplate<TContext extends WebContext>
    extends Service<TContext, WebPlugin>
    implements Webserver<TContext, WebPlugin> {

    protected scopedDepsFactory?: ScopeDepsFn<ScopedDepsType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>, RegistryType<TContext>>;
    protected middlewareFactory?: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>, RegistryType<TContext>>;
    protected routeFactory?: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>, RegistryType<TContext>>;
    protected errorMiddlewareFactory?: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>, RegistryType<TContext>>;
    protected managedMiddleware: Array<{ paths: string[], handlers: Handler[] }> = [];
    protected managedRoutes: Array<{ method: Methods, paths: string[], handlers: Handler[] }> = [];
    protected _app?: Express;
    protected _appServer?: HttpBasedServer;

    scopedDeps(factory: ScopeDepsFn<ScopedDepsType<TContext>, BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>, RegistryType<TContext>>): this {
        this.scopedDepsFactory = factory;
        return this;
    }

    // TODO: Dynamic registration of deps
    protected wrapMiddleware(handler: Handler): RequestHandler {
        return (req, res, next) => {
            const deps = res.locals.deps;
            return errorBoundary(
                (req1, res1, next1) =>
                    handler(req1, res1, next1, deps))(req, res, next);
        };
    }

    // TODO: Dynamic registration of deps
    protected wrapRoute(handler: Handler): RequestHandler {
        return (req, res, next) => {
            const deps = res.locals.deps;
            return errorBoundary(
                (req1, res1, next1) =>
                    handler(req1, res1, next1, deps))(req, res, next);
        };
    }

    protected createWebContext(): WebContext<
        BaseConfig & ConfigType<TContext>,
        BaseDeps & DepsType<TContext> & ScopedDepsType<TContext>,
        RegistryType<TContext>
    > {
        return {
            // Type weirdness here.  Would not mind help from someone smarter with TS.
            config: this._config! as unknown as BaseConfig & ConfigType<TContext>,
            deps: this._container!.cradle,
            container: this._container!,
            // Type weirdness here.  Would not mind help from someone smarter with TS.
            registry: this.getRegistry() as unknown as Registry<RegistryType<TContext> & RegistryMap>,
            app: this._app!,
        }
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


    use(paths?: string | string[], ...handlers: Handler[]): this {
        this.managedMiddleware.push({
            paths: (Array.isArray(paths) ? paths : [paths].filter(Boolean)) as string[],
            handlers,
        });
        return this;
    }

    route<TMethod extends Methods = any>(method: TMethod, paths: string | string[], ...handlers: Handler[]): this {
        this.managedRoutes.push({
            method: method,
            paths: (Array.isArray(paths) ? paths : [paths]) as string[],
            handlers,
        });
        return this;
    }

    get dangerZone(): DangerZone<ConfigType<TContext>, DepsType<TContext>, RegistryType<TContext>, ScopedDepsType<TContext>> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const me = this;
        return {
            setAppMiddleware: (
                customize: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>, RegistryType<TContext>>
            ): Webserver<TContext, WebPlugin> => {
                this.middlewareFactory = customize;
                return me;
            },
            setAppRoutes: (
                customize: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>, RegistryType<TContext>>
            ): Webserver<TContext, WebPlugin> => {
                this.routeFactory = customize;
                return me;
            },
            setAppErrorMiddleware: (
                customize: CustomizeAppFn<BaseDeps & DepsType<TContext>, BaseConfig & ConfigType<TContext>, RegistryType<TContext>>
            ): Webserver<TContext, WebPlugin> => {
                this.errorMiddlewareFactory = customize;
                return me;
            }
        };
    }

}