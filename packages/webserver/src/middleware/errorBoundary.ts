import { RequestHandler } from 'express';

import formatError from '../../../api/src/errors/formatError';

export default function errorBoundary(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    const { logger } = res.locals.deps;
    try {
      await handler(req, res, next);
    } catch (error) {
      logger.error(formatError(error), 'An error occurred executing the request.');
      return next(error);
    }
  };
}
