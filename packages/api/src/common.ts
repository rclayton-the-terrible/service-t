import Joi from 'joi';

export type UUID = string;

export const UUIDSchema = Joi.string().uuid();

export type Port = number;

export const PortSchema = Joi.number().integer().min(1024).max(65535);

export type Milliseconds = number;

export const MillisecondsSchema = Joi.number().integer().min(0);
