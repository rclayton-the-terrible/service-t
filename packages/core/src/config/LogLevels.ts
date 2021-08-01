import Joi from 'joi';

export enum LogLevels {
    Trace = 'trace',
    Debug = 'debug',
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
    Fatal = 'fatal',
}

export const LogLevelsSchema = Joi.string().valid(...Object.values(LogLevels));
