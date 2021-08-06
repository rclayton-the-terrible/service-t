import { HealthCheckResult, HealthCheckStatuses } from '@service-t/api/dist/health/HealthCheck';
import { HealthCheckService } from '../model/HealthCheckService';
import { Registry } from '../model/Service';
import { Logger } from 'pino';

import ServiceHealthEvaluator, { ServiceHealthResult } from '@service-t/api/dist/health/ServiceHealthEvaluator';
import Bluebird from 'bluebird';
import HealthCheck from '@service-t/api/dist/health/HealthCheck';

import formatError from '@service-t/api/dist/errors/formatError';

type HealthCheckResults = (HealthCheckResult | HealthCheckResult[])[];

export default class DefaultHealthCheckService implements HealthCheckService {

    protected healthChecks: HealthCheck[];

    constructor(
      protected logger: Logger,
      protected registry: Registry,
      protected serviceHealthEvaluator: ServiceHealthEvaluator
    ) {
      this.healthChecks = registry.getAll('checks');
    }

    protected async doCheck(check: HealthCheck): Promise<HealthCheckResult | HealthCheckResult[]> {
      try {
        return check.evaluateHealth();
      } catch (error) {
        const formattedError = formatError(error);
        this.logger.error({ ...formattedError, checkId: check.id }, 'An error occurred evaluating health check.');
        return {
          id: check.id,
          status: HealthCheckStatuses.Unhealthy,
          message: 'Failed to evaluate health check; error thrown.',
          error: formattedError,
        };
      }
    }

    async runHealthChecks(): Promise<ServiceHealthResult> {
      this.logger.debug('Running service health checks.');
      const results: HealthCheckResults = await Bluebird.map(
        this.healthChecks,
        this.doCheck.bind(this),
        { concurrency: 10 }
      );
      const checkResults = results.reduce((acc: HealthCheckResult[], maybeArray) => acc.concat(
        Array.isArray(maybeArray) ?
          maybeArray as HealthCheckResult[] :
          [maybeArray as HealthCheckResult]
      ), [] as HealthCheckResult[]);
      return this.serviceHealthEvaluator.evaluateServerHealth(checkResults);
    }
}
