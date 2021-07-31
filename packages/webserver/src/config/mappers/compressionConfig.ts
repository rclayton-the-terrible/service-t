import { BaseWebConfig } from '../BaseWebConfig';

import Joi from 'joi';

import configFromEnv from '@service-t/core/dist/factories/configFromEnv';

type Environment = {
  HTTP_COMPRESSION_CHUNK_SIZE: number,
  HTTP_COMPRESSION_LEVEL: number,
  HTTP_COMPRESSION_MEM_LEVEL: number,
  HTTP_COMPRESSION_WINDOW_BITS: number,
};

// Defaults come directly from: http://expressjs.com/en/resources/middleware/compression.html
const EnvironmentSchema = Joi.object<Environment>().keys({
  HTTP_COMPRESSION_CHUNK_SIZE: Joi.number().integer().min(1).default(16384),
  HTTP_COMPRESSION_LEVEL: Joi.number().integer().min(-1).max(9).default(6),
  HTTP_COMPRESSION_MEM_LEVEL: Joi.number().integer().min(1).max(9).default(8),
  HTTP_COMPRESSION_WINDOW_BITS: Joi.number().integer().min(1).default(15),
}).unknown(true);

export default configFromEnv<Pick<BaseWebConfig, 'compression'>, Environment>(EnvironmentSchema, async (env) => ({
  compression: {
    chunkSize: env.HTTP_COMPRESSION_CHUNK_SIZE,
    level: env.HTTP_COMPRESSION_LEVEL,
    memLevel: env.HTTP_COMPRESSION_MEM_LEVEL,
    windowBits: env.HTTP_COMPRESSION_WINDOW_BITS,
  }
}));
