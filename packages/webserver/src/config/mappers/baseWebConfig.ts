import { Port, PortSchema } from '@service-t/api/dist/common';
import { HttpProtocols } from '@service-t/core/dist/config/HttpProtocols';
import { BaseWebConfig } from '../BaseWebConfig';

import Joi from 'joi';

import configFromEnv from '@service-t/core/dist/factories/configFromEnv';

type Environment = {
  HTTP_PORT: Port,
  HTTP_PROTOCOL: HttpProtocols,
  HTTP_TRUST_PROXY: boolean,
  HTTP_REMOVE_POWERED_BY: boolean,
  HTTP_USE_COMPRESSION: boolean,
  HTTP_USE_SCOPED_DEPS: boolean,
};

const EnvironmentSchema = Joi.object<Environment>().keys({
  HTTP_PORT: PortSchema.default(8080),
  HTTP_PROTOCOL: Joi.string().valid(...Object.values(HttpProtocols)).default(HttpProtocols.HTTP),
  HTTP_TRUST_PROXY: Joi.boolean().default(true),
  HTTP_REMOVE_POWERED_BY: Joi.boolean().default(true),
  HTTP_USE_COMPRESSION: Joi.boolean().default(true),
  HTTP_USE_SCOPED_DEPS: Joi.boolean().default(true),
}).unknown(true);

export default configFromEnv<Omit<BaseWebConfig, 'cors'>, Environment>(EnvironmentSchema, async (env) => ({
  http: {
    protocol: env.HTTP_PROTOCOL,
    port: env.HTTP_PORT,
    enabled: {
      trustProxy: env.HTTP_TRUST_PROXY,
      removePoweredBy: env.HTTP_REMOVE_POWERED_BY,
      compression: env.HTTP_USE_COMPRESSION,
      scopeDeps: env.HTTP_USE_SCOPED_DEPS,
    }
  },
}));
