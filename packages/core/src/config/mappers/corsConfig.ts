import { BaseConfig } from '../BaseConfig';

import configFromEnv from '../../factories/configFromEnv';

import Joi from 'joi';

type Environment = {
  CORS_ORIGIN: string[]
};

const EnvironmentSchema = Joi.object<Environment>().keys({
  CORS_ORIGIN: Joi.array().items(Joi.string()).default('*'),
}).unknown(true);

export default configFromEnv<Pick<BaseConfig, 'cors'>, Environment>(EnvironmentSchema, async (env) => ({
  cors: {
    origin: env.CORS_ORIGIN,
  },
}));
