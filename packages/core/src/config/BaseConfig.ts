import { NodeEnvironments } from './NodeEnvironments';
import { WebServerConfig } from './WebServerConfig';
import { Milliseconds } from '@service-t/api/dist/common';
import { LogLevels } from './LogLevels';

export type BaseConfig = {
  logger: {
    level: LogLevels,
  },
  nodeEnvironment: NodeEnvironments,
  hostname: string,
  adminHttp: WebServerConfig,
  shutdownGracePeriod: Milliseconds
}
