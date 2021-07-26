import { CodedError } from './CodedError';

export const UNKNOWN_AUTHENTICATION_REALM_ERROR = 'errors.res.auth.realm_unknown';

/**
 * Realm supplied in an authentication context is unknown to the application.
 */
export default class UnknownAuthenticationRealmError extends CodedError {

  public code = UNKNOWN_AUTHENTICATION_REALM_ERROR;

  constructor(public realm: string) {
    super(`Unknown authentication realm: ${realm}`);
    Error.captureStackTrace(this, UnknownAuthenticationRealmError);
  }
}
