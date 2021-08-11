import { ErrorRequestHandler } from 'express';
import { isObject } from 'lodash';
import { BAD_CONFIGURATION_ERROR_CODE } from '@service-t/api/dist/errors/BadConfigurationError';
import { BAD_STATE_ERROR_CODE } from '@service-t/api/dist/errors/BadStateError';
import { INVALID_AUTHENTICATION_ERROR } from '@service-t/api/dist/errors/InvalidAuthenticationError';
import { UNKNOWN_AUTHENTICATION_REALM_ERROR } from '@service-t/api/dist/errors/UnknownAuthenticationRealmError';

import Boom from 'boom';
import ResourceNotFoundError, { RESOURCE_NOT_FOUND_ERROR_CODE } from '@service-t/api/dist/errors/ResourceNotFoundError';
import ValidationError, { VALIDATION_ERROR_CODE } from '@service-t/api/dist/errors/ValidationError';
import AuthenticationRequiredError, { AUTHENTICATION_REQUIRED_ERROR_CODE } from '@service-t/api/dist/errors/AuthenticationRequiredError';
import ServiceUnavailableError, { SERVICE_UNAVAILABLE_ERROR_CODE } from '@service-t/api/dist/errors/ServiceUnavailableError';
import InternalError, { INTERNAL_ERROR_CODE } from '@service-t/api/dist/errors/InternalError';

type ErrorWithCode = {
  code: string,
}

type ErrorWithType = {
  type?: string,
}

export type Matcher = {
  isMatch(error: ErrorWithCode): boolean,
  map<T>(error: T): Boom,
}

export function prefixMatchCode<T>(code: string, map: (error: T) => Boom): Matcher {
  return {
    isMatch: (error) => error.code.toLowerCase().startsWith(code.toLowerCase()),
    map: (error) => map(error as unknown as T),
  };
}

const matchers: Array<Matcher> = [
  prefixMatchCode(
    RESOURCE_NOT_FOUND_ERROR_CODE,
    (error: ResourceNotFoundError) => Boom.notFound(error.message, error)
  ),
  prefixMatchCode(
    VALIDATION_ERROR_CODE,
    (error: ValidationError) => {
      return Boom.badRequest(error.message, error.invalidParams);
    }
  ),
  prefixMatchCode(
    AUTHENTICATION_REQUIRED_ERROR_CODE,
    // IDK why, but there is not a simple data pass-through on Boom's unauthorized function.
    (error: AuthenticationRequiredError) => Object.assign(Boom.unauthorized('Authentication Required'), {
      data: { redirect: error.redirectToSSO },
    }),
  ),
  prefixMatchCode(
    UNKNOWN_AUTHENTICATION_REALM_ERROR,
    () => Boom.unauthorized('Unknown Authentication Realm'),
  ),
  prefixMatchCode(
    INVALID_AUTHENTICATION_ERROR,
    () => Boom.unauthorized('Authentication Parameters Invalid'),
  ),
  prefixMatchCode(
    BAD_CONFIGURATION_ERROR_CODE,
    () => Boom.internal('Bad Configuration'),
  ),
  prefixMatchCode(
    BAD_STATE_ERROR_CODE,
    () => Boom.internal('Bad State'),
  ),
  prefixMatchCode(
    SERVICE_UNAVAILABLE_ERROR_CODE,
    (error: ServiceUnavailableError) => Boom.serverUnavailable(error.message),
  ),
  {
    isMatch: () => true,
    map: () => Boom.internal(),
  }
];

export function mapTypedErrorToCodedError(typedError: ErrorWithType): ErrorWithCode {
  switch (typedError.type!) {
    case 'entity.parse.failed':
      return new ValidationError('Body is not valid JSON or URL Encoded Form Body.');
    default:
      return {
        ...typedError,
        code: INTERNAL_ERROR_CODE,
      };
  }
}

export function convertToCodedError(error: unknown): ErrorWithCode {
  if (isObject(error)) {
    if ((error as ErrorWithCode).code) {
      return error as ErrorWithCode;
    }
    // This happens with Express errors (like bodyParser).
    else if ((error as ErrorWithType).type) {
      const typedError = error as ErrorWithType;
      return mapTypedErrorToCodedError(typedError);
    }
  }
  return new InternalError(error);
}

export function convertToBoom(codedError: ErrorWithCode): Boom {
  const handler = matchers.find(m => m.isMatch(codedError))!;
  return handler.map(codedError);
}

export default function factory(): ErrorRequestHandler {
  return (error, req, res, next) => {
    const codedError = convertToCodedError(error);
    const boomError = Boom.isBoom(error) ? error as Boom : convertToBoom(codedError);

    if (boomError.data?.redirect) {
      return res.redirect(boomError.data.redirect);
    }

    return res.status(boomError.output.statusCode).json({
      ...boomError.output.payload,
      // If the original error was a boom error, don't supply code.
      code: codedError.code,
      data: boomError.data,
    });
  };
}
