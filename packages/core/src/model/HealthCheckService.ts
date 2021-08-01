import { ServiceHealthResult } from '@service-t/api/dist/health/ServiceHealthEvaluator';

export interface HealthCheckService {
    runHealthChecks(): Promise<ServiceHealthResult>
}
