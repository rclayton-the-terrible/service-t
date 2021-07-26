import { Logger } from 'pino';
import { RequestHandler } from 'express';

export type BaseDeps = {
  logger: Logger,
  'middleware.requestParsers': RequestHandler[],
  'middleware.compression': RequestHandler,
}
