import { CodedError } from './CodedError';

export const SERVICE_UNAVAILABLE_ERROR_CODE = 'errors.res.unavailable';

export default class ServiceUnavailableError extends CodedError {
  public code = SERVICE_UNAVAILABLE_ERROR_CODE;

  constructor(public service: string, explanation: string, public extra: Record<string, any> = {}) {
    super(`Service ${service} is unavailable: ${explanation}`);
    Error.captureStackTrace(this, ServiceUnavailableError);
  }
}
