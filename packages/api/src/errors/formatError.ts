import { get } from 'lodash';
import { Labels } from '../Labels';

export type SerializedError = {
  name: string,
  message: string,
  stack?: string,
  code?: string,
}

export type MaybeStack = { stack?: string }
export type MaybeCode = { code?: string }

/**
 * Format an error for reporting to the console or web response.
 * @param error
 */
export default function formatError(error: Error): { error: SerializedError } {
  if (!error) error = new Error('Unknown error occurred (and passed to formatError).');
  return {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as MaybeCode).code,
    },
  };
}

/**
 * This is for formatting errors for tracing.
 * @param error
 */
export function formatErrorForTracing(error: Error): Labels {
  return {
    errorKind: error.name || get(error, 'constructor.name') || 'Error',
    message: error.message,
    stack: (error as MaybeStack).stack,
    code: (error as MaybeCode).code,
  };
}
