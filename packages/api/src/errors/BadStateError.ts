import { CodedError } from './CodedError';

export const BAD_STATE_ERROR_CODE = 'errors.res.badState';

/**
 * Data essential to the operation of the server is corrupted or in an incorrect state.
 * The operation cannot proceed while in this state.
 */
export default class BadStateError extends CodedError {

  public code = BAD_STATE_ERROR_CODE;

  constructor(description: string, public extra: Record<string, any> = {}) {
    super(`Bad State: ${description}`);
    Error.captureStackTrace(this, BadStateError);
  }
}
