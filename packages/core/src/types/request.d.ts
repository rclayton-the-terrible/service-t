import { AwilixContainer } from 'awilix';
import { AllDependencies } from '../dependencies/Dependencies';
import { ReqCtx } from '../model/app/ReqCtx';

declare global {
  namespace Express {
    interface Request {
      id: string,
      gdAuth?: {
        encodedJwt?: {
          jomax?: Record<string, unknown>,
        },
        jwt?: {
          jomax?:  Record<string, unknown>,
        },
      },
    }
    interface Response {
      locals: {
        deps?: Record<string, unknown>,
      }
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    scheme: string,
    username?: string,
    groups?: string[],
  }
}
