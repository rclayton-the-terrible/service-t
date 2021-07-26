import { CodedError } from './CodedError';

export const INTERNAL_ERROR_CODE = 'errors.res.internal';

export default class InternalError extends CodedError {
  public code = INTERNAL_ERROR_CODE;

  constructor(public innerError: unknown, public extra: Record<string, any> = {}) {
    super('An unexpected error occurred.');
    Error.captureStackTrace(this, InternalError);
  }
}
