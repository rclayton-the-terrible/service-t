import { HealthCheckService } from '../model/HealthCheckService';

import ServiceHealthEvaluator from '@service-t/api/dist/health/ServiceHealthEvaluator';

/**
 * Dependencies relied on by Service<T>.
 */
export type FrameworkDeps = {
    serviceHealthEvaluator: ServiceHealthEvaluator,
    healthCheckService: HealthCheckService,
}
