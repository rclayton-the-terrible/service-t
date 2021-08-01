import { HealthCheckResult } from "./HealthCheck";

export enum ServiceHealthStatuses {
    Healthy = 'healthy',
    Unhealthy = 'unhealthy'
}

/**
 * The only field required is the status, but you are welcome to add anything else you want
 * to the server health result.
 */
export type ServiceHealthResult = {
    status: ServiceHealthStatuses,
    /**
     * Append any other pertinent information you think would be important to display in the Admin health check route.
     */
    [key: string]: unknown,
}

/**
 * This is an algorithm that evaluates the status of the server based on the results of all registered
 * health checks.  This interface allows developers to override the default implementation with their own
 * custom evaluation criteria.
 */
export default interface ServiceHealthEvaluator {
    /**
     * Given all the results,
     * @param checkResults
     */
    evaluateServerHealth(checkResults: HealthCheckResult[]): Promise<ServiceHealthResult>
}
