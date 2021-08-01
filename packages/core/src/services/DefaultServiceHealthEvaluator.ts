import { HealthCheckResult } from '../../../api/dist/health/HealthCheck';
import { HealthCheckStatuses } from '@service-t/api/dist/health/HealthCheck';

import ServiceHealthEvaluator, { ServiceHealthStatuses, ServiceHealthResult } from '@service-t/api/dist/health/ServiceHealthEvaluator';

export default class DefaultServiceHealthEvaluator implements ServiceHealthEvaluator {
  async evaluateServerHealth(checkResults: HealthCheckResult[]): Promise<ServiceHealthResult> {
    const isUnhealthy = checkResults.some(result => result.status === HealthCheckStatuses.Unhealthy);
    return {
      status: isUnhealthy ? ServiceHealthStatuses.Unhealthy : ServiceHealthStatuses.Healthy,
      checks: checkResults,
    };
  }
}
