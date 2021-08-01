import { BaseConfig } from '../config/BaseConfig';
import { NameAndRegistrationPair, asFunction, asClass } from 'awilix';
import { BaseDeps } from './BaseDeps';

import DefaultServiceHealthEvaluator from '../services/DefaultServiceHealthEvaluator';
import DefaultHealthCheckService from '../services/DefaultHealthCheckService';

import pino from 'pino';

export default async function getBaseDeps(config: BaseConfig): Promise<NameAndRegistrationPair<BaseDeps>> {
  return {
    logger: asFunction(() => pino({ level: config.logger.level })).singleton(),
    serviceHealthEvaluator: asClass(DefaultServiceHealthEvaluator).singleton(),
    healthCheckService: asClass(DefaultHealthCheckService).singleton(),
  };
}
