import { NodeEnvironments } from './NodeEnvironments';
import { WebServerConfig } from './WebServerConfig';

export type BaseConfig = {
  nodeEnvironment: NodeEnvironments,
  hostname: string,
  adminHttp: WebServerConfig,
}
