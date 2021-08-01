import { NodeEnvironments } from '../NodeEnvironments';
import { BaseConfig } from '../BaseConfig';
import { HttpProtocols } from '../HttpProtocols';
import { MillisecondsSchema, Port, PortSchema } from '@service-t/api/dist/common';
import { LogLevels, LogLevelsSchema } from '../LogLevels';

import configFromEnv from '../../factories/configFromEnv';

import Joi from 'joi';

type Environment = {
  LOG_LEVEL: LogLevels,
  NODE_ENV: NodeEnvironments,
  HOSTNAME: string,
  ADMIN_HTTP_PORT: Port,
  SHUTDOWN_GRACE_PERIOD: number,
};

const EnvironmentSchema = Joi.object<Environment>().keys({
  LOG_LEVEL: LogLevelsSchema.default(LogLevels.Info),
  NODE_ENV: Joi.string().valid(...Object.values(NodeEnvironments)).default(NodeEnvironments.Production),
  HOSTNAME: Joi.string().default('unknown'),
  ADMIN_HTTP_PORT: PortSchema.default(8081),
  SHUTDOWN_GRACE_PERIOD: MillisecondsSchema.max(2 * 60 * 1000 /* 2m */).default(30 * 1000 /* 30s */),
}).unknown(true);

export default configFromEnv<Omit<BaseConfig, 'cors'>, Environment>(EnvironmentSchema, async (env) => ({
  logger: {
    level: env.LOG_LEVEL,
  },
  nodeEnvironment: env.NODE_ENV,
  hostname: env.HOSTNAME,
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
  shutdownGracePeriod: env.SHUTDOWN_GRACE_PERIOD,
}));
