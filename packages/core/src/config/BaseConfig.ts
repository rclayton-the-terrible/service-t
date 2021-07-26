import { NodeEnvironments } from './NodeEnvironments';
import { CorsOptions } from 'cors';
import { ServerConfig } from './ServerConfig';
import { CompressionOptions } from 'compression';

export type BaseConfig = {
  nodeEnvironment: NodeEnvironments,
  hostname: string,
  http: ServerConfig,
  adminHttp: ServerConfig,
  cors?: CorsOptions,
  compression?: CompressionOptions,
}
