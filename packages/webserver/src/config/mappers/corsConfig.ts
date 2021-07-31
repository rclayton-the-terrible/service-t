import {BaseWebConfig} from "../BaseWebConfig";

import Joi from 'joi';

import configFromEnv from "@service-t/core/dist/factories/configFromEnv";

type Environment = {
  CORS_ORIGIN: string[]
};

const EnvironmentSchema = Joi.object<Environment>().keys({
  CORS_ORIGIN: Joi.array().items(Joi.string()).default('*'),
}).unknown(true);

export default configFromEnv<Pick<BaseWebConfig, 'cors'>, Environment>(EnvironmentSchema, async (env) => ({
  cors: {
    origin: env.CORS_ORIGIN,
  },
}));
