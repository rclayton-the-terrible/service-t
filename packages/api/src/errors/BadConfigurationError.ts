/**
 * A component is improperly configured.
 * The operation cannot proceed while in this state.
 */
import { CodedError } from './CodedError';

export const BAD_CONFIGURATION_ERROR_CODE = 'errors.res.bad_configuration';

/**
 * A component is improperly configured.
 * The operation cannot proceed while in this state.
 */
export default class BadConfigurationError extends CodedError {

  public code = BAD_CONFIGURATION_ERROR_CODE;

  constructor(description: string, public extra: Record<string, any> = {}) {
    super(`Bad Configuration: ${description}`);
    Error.captureStackTrace(this, BadConfigurationError);
  }
}
