import { BaseConfig } from '../config/BaseConfig';
import { NameAndRegistrationPair, asFunction } from 'awilix';
import { BaseDeps } from './BaseDeps';

import pino from 'pino';

export default async function getBaseDeps(config: BaseConfig): Promise<NameAndRegistrationPair<BaseDeps>> {
  return {
    logger: asFunction(() => pino({})),
  };
}
