import { Request, Response, NextFunction } from 'express';

import errorBoundary from './errorBoundary';
import pino from 'pino';

describe('Error Boundary middleware', () => {

  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(function () {
    req = {
      query: { q: 'foo' },
      params: { id: 123 },
      body: { a: 'b' },
    } as unknown as Request;
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      locals: {
        deps: {
          logger: pino({ enabled: false }),
        },
      },
    } as unknown as Response;
    next = jest.fn();
  });

  it('should catch unhandled promise rejections', async () => {
    await errorBoundary(() => {
      return Promise.reject(new Error('Kaboom'));
    })(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should catch uncaught errors', () => {
    errorBoundary(() => {
      throw new Error('Kaboom');
    })(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
