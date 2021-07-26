import { CodedError } from './CodedError';

export const DUPLICATE_RESOURCE_ERROR_CODE = 'errors.req.duplicateResource';

export default class DuplicateResourceError extends CodedError {
  public code = DUPLICATE_RESOURCE_ERROR_CODE;

  constructor(
    public resourceType: string,
    public existingResourceId: string | number,
    public extra: Record<string, any> = {}
  ) {
    super(`A duplicate [${resourceType}] already exists: ${existingResourceId}`);
  }
}
