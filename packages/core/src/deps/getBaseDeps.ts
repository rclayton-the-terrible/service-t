import { BaseConfig } from '../config/BaseConfig';
import { NameAndRegistrationPair, asFunction, asValue } from 'awilix';
import { BaseDeps } from './BaseDeps';

import pino from 'pino';
import express from 'express';
import compression from 'compression';

export default async function getBaseDeps(config: BaseConfig): Promise<NameAndRegistrationPair<BaseDeps>> {
  return {
    logger: asFunction(() => pino({})),
    'middleware.requestParsers': asValue([express.json(), express.urlencoded({ extended: true })]),
    'middleware.compression': asValue(compression(config.compression)),
  };
}
