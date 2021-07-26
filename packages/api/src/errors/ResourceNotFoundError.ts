import { CodedError } from './CodedError';

export const RESOURCE_NOT_FOUND_ERROR_CODE = 'errors.req.notFound';

export default class ResourceNotFoundError extends CodedError  {
  public code = RESOURCE_NOT_FOUND_ERROR_CODE;

  constructor(public resourceType: string, public identifiedBy: string | number, public extra: Record<string, unknown> = {}) {
    super(`Resource of type [${resourceType}], identified by [${identifiedBy}] was not found`);
  }
}
