export enum HealthCheckStatuses {
    Healthy = 'healthy',
    Unhealthy = 'unhealthy',
    /**
     * Ported from the Nagios world and is simply used to me that the health could not be
     * determined for some reason.  Generally, you should avoid using this.
     */
    Unknown = 'unknown'
}

/**
 * The result of a health check.
 */
export type HealthCheckResult = {
    /**
     * Propagate the original check ID, or if returning multiple results, a unique instance ID of this result.
     */
    id: string,
    /**
     * Status of the component being checked.
     */
    status: HealthCheckStatuses,
    /**
     * You are welcome to add any other pertinent information to this result.  This info will be output on the
     * admin health check route.
     */
    [key: string]: unknown,
}

/**
 * Components that want to participate in server health evaluation need to implement this interface
 * and add an entry to Registry.checks.
 */
export default interface HealthCheck {
    /**
     * Uniquely identifies this check from others.
     *
     * While this SHOULD be unique, the constraint is not enforce.  The purpose is to help operators
     * understand which component is failing.  For instance, if you have two Postgres clients connected to different
     * databases, it would be helpful to know which client is failing the check.
     *
     * There is also no constraint on the format of the ID.  I would encourage developers to be consistent; my
     * preference would be ARN (Amazon Resource Notation) syntax (e.g. com:example:hc:postgres:usersdb), especially
     * if you rely on checks from external plugins.
     */
    id: string,
    /**
     * Maybe not the greatest name, but the intent is to avoid
     * possible collisions with method names that my be used in a class.
     *
     * @returns One or more health checks.
     */
    evaluateHealth(): Promise<HealthCheckResult | HealthCheckResult[]>
}
