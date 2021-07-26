import { ConfigFactoryFn } from '../model/Service';
import { ObjectSchema } from 'joi';
import { SomeObject } from '@service-t/api/dist/SomeObject';

import BadConfigurationError from '@service-t/api/dist/errors/BadConfigurationError';

export type MapEnvToConfigFactoryFn<
  TConfig extends SomeObject,
  TEnv extends SomeObject = NodeJS.ProcessEnv
> = (env: TEnv) => Promise<Partial<TConfig>>

/**
 * Manipulate the Environment prior to Joi validation/normalization.
 */
export type MutateEnvFn = (env: NodeJS.ProcessEnv) => Promise<NodeJS.ProcessEnv>

/**
 * Manipulate the configuration after Joi validation/normalization.
 */
export type MutateConfigFn<
  TConfig extends SomeObject,
  TEnv extends SomeObject = NodeJS.ProcessEnv
> = (config: Partial<TConfig>, env: TEnv) => Promise<Partial<TConfig>>

/**
 * Options for Configuration.
 */
export type ConfigFromEnvOptions<
  TConfig extends SomeObject,
  TEnv extends SomeObject = NodeJS.ProcessEnv
> = {
  mutateEnv?: MutateEnvFn | Array<MutateEnvFn>,
  mutateConfig?: MutateConfigFn<TConfig, TEnv> | Array<MutateConfigFn<TConfig, TEnv>>,
}

export function normalizeToArray<T>(thing?: T | Array<T>): Array<T> {
  if (!thing) {
    return [];
  }
  return Array.isArray(thing) ? thing : [thing];
}

export default function configFromEnv<TConfig extends SomeObject, TEnv extends SomeObject = NodeJS.ProcessEnv>(
  schema: ObjectSchema<TEnv>,
  mapper: MapEnvToConfigFactoryFn<TConfig, TEnv>,
  options: ConfigFromEnvOptions<TConfig, TEnv> = {},
): ConfigFactoryFn<TConfig> {
  return async (env) => {
    const mutateEnvTransforms = normalizeToArray(options.mutateEnv);
    const mutateConfigTransforms = normalizeToArray(options.mutateConfig);

    let mutatedEnv = { ...env };

    for (const mutate of mutateEnvTransforms) {
      mutatedEnv = await mutate(mutatedEnv);
    }

    const { error, value } = schema.validate(mutatedEnv, {
      abortEarly: false,
    });

    if (error) {
      throw new BadConfigurationError(
        'Process environment variables invalid.  Cannot extract configuration.',
        error
      );
    }

    let config = await mapper(value);

    for (const mutate of mutateConfigTransforms) {
      config = await mutate(config, value);
    }

    return config as TConfig;
  };
}
