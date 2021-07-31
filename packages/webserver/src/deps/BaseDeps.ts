import { Logger } from 'pino';
import { RequestHandler } from 'express';

export type BaseDeps = {
    'middleware.requestParsers': RequestHandler[],
    'middleware.compression': RequestHandler,
}
