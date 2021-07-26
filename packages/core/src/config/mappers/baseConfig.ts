import { NodeEnvironments } from '../NodeEnvironments';
import { BaseConfig } from '../BaseConfig';
import { HttpProtocols } from '../HttpProtocols';
import { Port, PortSchema } from '@service-t/api/dist/common';

import configFromEnv from '../../factories/configFromEnv';

import Joi from 'joi';

type Environment = {
  NODE_ENV: NodeEnvironments,
  HOSTNAME: string,
  HTTP_PORT: Port,
  HTTP_PROTOCOL: HttpProtocols,
  HTTP_TRUST_PROXY: boolean,
  HTTP_REMOVE_POWERED_BY: boolean,
  HTTP_USE_COMPRESSION: boolean,
  HTTP_USE_SCOPED_DEPS: boolean,
  ADMIN_HTTP_PORT: Port,
};

const EnvironmentSchema = Joi.object<Environment>().keys({
  NODE_ENV: Joi.string().valid(...Object.values(NodeEnvironments)).default(NodeEnvironments.Production),
  HOSTNAME: Joi.string().default('unknown'),
  HTTP_PORT: PortSchema.default(8080),
  HTTP_PROTOCOL: Joi.string().valid(...Object.values(HttpProtocols)).default(HttpProtocols.HTTP),
  HTTP_TRUST_PROXY: Joi.boolean().default(true),
  HTTP_REMOVE_POWERED_BY: Joi.boolean().default(true),
  HTTP_USE_COMPRESSION: Joi.boolean().default(true),
  HTTP_USE_SCOPED_DEPS: Joi.boolean().default(true),
  ADMIN_HTTP_PORT: PortSchema.default(8081),
}).unknown(true);

export default configFromEnv<Omit<BaseConfig, 'cors'>, Environment>(EnvironmentSchema, async (env) => ({
  nodeEnvironment: env.NODE_ENV,
  hostname: env.HOSTNAME,
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
  adminHttp: {
    protocol: HttpProtocols.HTTP,
    port: env.ADMIN_HTTP_PORT,
    enabled: {
      trustProxy: false,
      removePoweredBy: true,
      compression: false,
      scopeDeps: false,
    }
  },
}));
