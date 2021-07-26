import { CodedError } from './CodedError';
import { ValidationError as JoiValidationError, ValidationErrorItem } from 'joi';

export const VALIDATION_ERROR_CODE = 'errors.req.validation';

export default class ValidationError extends CodedError {

  public code = VALIDATION_ERROR_CODE;

  public invalidParams: ValidationErrorItem[] = [];

  constructor(messageOrJoiError: string | JoiValidationError, public extra: Record<string, any> = {}) {
    super(`Invalid parameters: ${(messageOrJoiError as JoiValidationError).message || messageOrJoiError}`);
    const joiError = messageOrJoiError as JoiValidationError;
    if (joiError.isJoi) {
      this.invalidParams.push(...joiError.details);
    }
    Error.captureStackTrace(this, ValidationError);
  }
}
