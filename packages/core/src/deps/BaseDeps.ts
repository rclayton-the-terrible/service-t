import { Logger } from 'pino';
import { FrameworkDeps } from './FrameworkDeps';
import { Registry } from '../model/Service';

export type BaseDeps = FrameworkDeps & {
  logger: Logger,
  registry: Registry,
}
