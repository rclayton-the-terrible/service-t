import { Request, Response, NextFunction } from 'express';

import ResourceNotFoundError from '@service-t/api/dist/errors/ResourceNotFoundError';
import ValidationError from '@service-t/api/dist/errors/ValidationError';
import AuthenticationRequiredError from '@service-t/api/dist/errors/AuthenticationRequiredError';
import UnknownAuthenticationRealmError from '@service-t/api/dist/errors/UnknownAuthenticationRealmError';
import InvalidAuthenticationError from '@service-t/api/dist/errors/InvalidAuthenticationError';
import ServiceUnavailableError from '@service-t/api/dist/errors/ServiceUnavailableError';
import BadConfigurationError from '@service-t/api/dist/errors/BadConfigurationError';
import BadStateError from '@service-t/api/dist/errors/BadStateError';
import InternalError from '@service-t/api/dist/errors/InternalError';

import errorMapper from './errorMapper';

describe('Error Mapper Middleware', () => {

  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as unknown as Request;
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      send: jest.fn(() => res),
    } as unknown as Response;
    next = jest.fn();
  });

  const mapError = (error: any) => errorMapper()(error, req, res, next);

  it('should map a ResourceNotFoundError to the proper boom response', () => {
    mapError(new ResourceNotFoundError('foo', 'bar'));
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should map a ValidationError to the proper boom response', () => {
    mapError(new ValidationError('Bad param'));
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should map a AuthenticationRequiredError to the proper boom response', () => {
    mapError(new AuthenticationRequiredError());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should map a UnknownAuthenticationRealmError to the proper boom response', () => {
    mapError(new UnknownAuthenticationRealmError('foobar'));
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should map a InvalidAuthenticationError to the proper boom response', () => {
    mapError(new InvalidAuthenticationError('bad robot'));
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should map a ServiceUnavailableError to the proper boom response', () => {
    mapError(new ServiceUnavailableError('fooService', 'bar'));
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('should map a BadConfigurationError to the proper boom response', () => {
    mapError(new BadConfigurationError('Configuration invalid'));
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should map a BadStateError to the proper boom response', () => {
    mapError(new BadStateError('Bad State'));
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should map a InternalError to the proper boom response', () => {
    mapError(new InternalError('Kaboom'));
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should map a plain error to a 500 boom response', () => {
    mapError(new Error('Kaboom'));
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should map a string error to a 500 boom response', () => {
    mapError('Kaboom');
    expect(res.status).toHaveBeenCalledWith(500);
  });

  describe('when handling errors with [type] field', () => {
    it('should map a parsing error to a 400 boom response', () => {
      mapError({
        type: 'entity.parse.failed',
      });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should map unknown types to a 500 boom response', () => {
      mapError({
        type: 'foo.bar',
      });
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
