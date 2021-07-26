import { CodedError } from './CodedError';

export const INVALID_AUTHENTICATION_ERROR = 'errors.res.auth.invalid';

/**
 * Authentication parameters were invalid.
 */
export default class InvalidAuthenticationError extends CodedError {

  public code = INVALID_AUTHENTICATION_ERROR;

  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, InvalidAuthenticationError);
  }
}
