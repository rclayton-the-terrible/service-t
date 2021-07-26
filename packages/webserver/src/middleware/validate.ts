import Joi from 'joi';

import { get, omit, pick } from 'lodash';
import { Schema } from 'joi';
import { Request, Response, NextFunction, RequestHandler } from 'express';

import Boom from 'boom';

import formatError from '../../../api/src/errors/formatError';

type ValidationOptions = {
  /**
   * Remove properties in Arrays or Objects that are not found in Schema definitions.
   * DEFAULT: false (unknown properties are retained)
   */
  stripUnknown?: boolean,
  /**
   * Terminate on first validation error.
   * DEFAULT: false (this allows us to show all errors).
   */
  abortEarly?: boolean,
  /**
   * Allow unknown properties to be present.
   * DEFAULT false.
   * This should be true if you want to use stripUnknown.
   */
  allowUnknown?: boolean,
}

export type RequestValidation = {
  query?: Schema,
  params?: Schema,
  body?: Schema,
  file?: Schema,
  options?: ValidationOptions
}

export default function validate(
  { query, params, body, options }: RequestValidation,
  shouldLogValError?: boolean
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {

    const { logger } = res.locals.deps;

    const mergedSchema = Joi.object().keys({
      query: query || Joi.object().unknown(true),
      params: params || Joi.object().unknown(true),
      body: body || Joi.object().unknown(true),
    });

    const requestState = pick(req, ['query', 'params', 'body']);

    // abortEarly will cause Joi to return upon finding the first validation error.
    const joiOptions = Object.assign({ abortEarly: false }, options);

    const { error, value } = mergedSchema.validate(requestState, joiOptions);

    if (error) {

      if (shouldLogValError) {
        logger.warn(formatError(error), 'Request was invalid.');
      }

      const boomRes = Boom.badRequest(
        get(error, 'details.message'),
        omit(get(error, 'details'), ['message'])
      );

      return res.status(400).json({
        ...boomRes.output.payload,
        data: boomRes.data,
      });
    }

    Object.assign(req, value);

    return next();
  };
}
