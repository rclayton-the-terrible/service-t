import Joi from 'joi';

import { Request, Response, NextFunction } from 'express';

import pino from 'pino';
import validate from './validate';

describe('Validate', () => {

  const body = Joi.object().keys({
    foo: Joi.string().valid('bar')
  });

  const query = Joi.object().keys({
    page: Joi.number().default(1),
    limit: Joi.number().default(25),
  });

  const params = Joi.object().keys({
    id: Joi.string().alphanum().min(12).max(12).required()
  });

  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
      locals: {
        deps: {
          logger: pino({ enabled: false }),
        },
      }
    } as unknown as Response;
    next = jest.fn();
  });

  it('should allow some of the params to be specified', () => {
    req = {
      body: { foo: 'bar' },
      params: { id: 'abcd1234abcd' },
      query: {},
    } as unknown as Request;
    validate({ body, params })(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should allow all of the params to be specified', () => {
    req = {
      body: { foo: 'bar' },
      params: { id: 'abcd1234abcd' },
      query: { page: 2 },
      deps: {
        logger: pino({ enabled: false }),
      },
    } as unknown as Request;
    validate({ body, params, query })(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should return a 400 boom response if invalid', () => {
    req = {
      body: { foo: 'no' },
      params: { id: 'asd' },
      query: { page: '23' },
    } as unknown as Request;
    validate({ body, params })(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: expect.any(String),
      error: expect.anything(),
      data: expect.anything(),
    }));
  });

  it('should assign defaults to the pertinent objects on the request', () => {
    req = {
      body: {},
      params: {},
      query: {},
    } as unknown as Request;
    validate({ query })(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.query.page).toEqual(1);
    expect(req.query.limit).toEqual(25);
  });

  it('should allow unknown properties', () => {
    req = {
      body: {
        foo: 'bar',
        bar: 'foo',
      },
      params: {},
      query: {},
    } as unknown as Request;
    validate({ body, options: { allowUnknown: true } })(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body.foo).toEqual('bar');
    expect(req.body.bar).toEqual('foo');
  });

  it('should allow unknown properties to be stripped', () => {
    req = {
      body: {
        foo: 'bar',
        bar: 'foo',
      },
      params: {},
      query: {},
    } as unknown as Request;
    validate({ body, options: { stripUnknown: true } })(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body.foo).toEqual('bar');
    expect(req.body.bar).toBeFalsy();
  });
});
