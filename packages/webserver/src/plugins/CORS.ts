import { asFunction } from 'awilix';
import { WebPlugin, WebContext } from '../model/Webserver';
import { BaseWebConfig } from "../config/BaseWebConfig";
import { Express, RequestHandler } from 'express';

import cors, { CorsOptions } from 'cors';
import corsConfig from '../config/mappers/corsConfig';
import configFromConstant from '@service-t/core/dist/factories/configFromConstant';

type SuppliedConfig = Pick<BaseWebConfig, 'cors'>;

type SuppliedDeps = {
  'middleware.cors': RequestHandler,
}

export default class CORS implements WebPlugin<SuppliedConfig, SuppliedDeps> {
  name = 'CORS';
  // Default to pulling from the environment.
  config = corsConfig;

  constructor(options?: CorsOptions) {
    // If supplied, use the constant value.
    if (options) {
      this.config = configFromConstant<SuppliedConfig>({ cors: options });
    }
  }

  async deps(config: SuppliedConfig) {
    return {
      // Register the middleware with Awilix
      'middleware.cors': asFunction(() => cors(config.cors)),
    };
  }

  async middleware(app: Express, ctx: WebContext) {
    // Pull the middleware from DI and bind to Express.
    // NOTE: we could have just instantiated the middleware here and registered it with Express.
    // However, one advantage of registering it with Awilix is that a user could optionally shadow
    // the dependency with their own implementation.
    app.use(ctx.deps['middleware.cors']);
  }
}
