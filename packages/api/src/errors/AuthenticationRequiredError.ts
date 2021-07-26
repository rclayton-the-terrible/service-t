import { CodedError } from './CodedError';

export const AUTHENTICATION_REQUIRED_ERROR_CODE = 'errors.res.auth.required';

/**
 * Authentication is required to perform this action.
 */
export default class AuthenticationRequiredError extends CodedError {

  public code = AUTHENTICATION_REQUIRED_ERROR_CODE;

  constructor(public redirectToSSO?: string) {
    super('Authentication Required');
    Error.captureStackTrace(this, AuthenticationRequiredError);
  }
}
