import { BaseWebConfig } from '../config/BaseWebConfig';
import { NameAndRegistrationPair, asValue } from 'awilix';
import { BaseDeps } from './BaseDeps';

import express from 'express';
import compression from 'compression';

export default async function getBaseDeps(config: BaseWebConfig): Promise<NameAndRegistrationPair<BaseDeps>> {
    return {
        'middleware.requestParsers': asValue([express.json(), express.urlencoded({ extended: true })]),
        'middleware.compression': asValue(compression(config.compression)),
    };
}
