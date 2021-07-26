import { ConfigFactoryFn } from '../model/Service';
import { SomeObject } from '@service-t/api/dist/SomeObject';

// Accepts multiple config factories and merges into one config object
/**
 *
 * @param env
 * @param factories
 */
export default async function mergeConfigFactories<TConfig extends SomeObject>(
  env: NodeJS.ProcessEnv,
  factories: Array<ConfigFactoryFn<Partial<TConfig>>>
): Promise<TConfig> {

  const configParts: Array<Partial<TConfig>> = [];

  for (const factory of factories) {
    const config = await factory(env);
    configParts.push(config);
  }

  return configParts.reduce((baseConfig, partialConfig) => {
    return {
      ...baseConfig,
      ...partialConfig,
    };
  }, {} as Partial<TConfig>) as TConfig;
}
