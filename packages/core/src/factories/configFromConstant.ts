import { ConfigFactoryFn } from '../model/Service';
import { SomeObject } from '@service-t/api/dist/SomeObject';

export default function configFromConstant<TConfig extends SomeObject>(config: TConfig): ConfigFactoryFn<Partial<TConfig>> {
  return async () => config;
}
