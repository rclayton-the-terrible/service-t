import { asFunction } from 'awilix';
import { ServicePlugin, ServiceContext } from '@service-t/core/dist/model/Service';
import { BaseConfig } from '@service-t/core/dist/config/BaseConfig';
import { Express, RequestHandler } from 'express';

import cors, { CorsOptions } from 'cors';
import corsConfig from '@service-t/core/dist/config/mappers/corsConfig';
import configFromConstant from '@service-t/core/dist/factories/configFromConstant';

type SuppliedConfig = Pick<BaseConfig, 'cors'>;

type SuppliedDeps = {
  'middleware.cors': RequestHandler,
}

export default class CORS implements ServicePlugin<SuppliedConfig, SuppliedDeps> {
  name = 'CORS';
  // Default to pulling from the environment.
  config = corsConfig;

  constructor(options?: CorsOptions) {
    // If supplied, use the constant value.
    if (options) {
      this.config = configFromConstant<SuppliedConfig>({ cors: options });
    }
  }

  async deps(config: BaseConfig) {
    return {
      // Register the middleware with Awilix
      'middleware.cors': asFunction(() => cors(config.cors)),
    };
  }

  async middleware(app: Express, ctx: ServiceContext) {
    // Pull the middleware from DI and bind to Express.
    // NOTE: we could have just instantiated the middleware here and registered it with Express.
    // However, one advantage of registering it with Awilix is that a user could optionally shadow
    // the dependency with their own implementation.
    app.use(ctx.deps['middleware.cors']);
  }
}
