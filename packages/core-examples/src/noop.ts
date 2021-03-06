import Axios from 'axios';
import ServiceTemplate from "@service-t/core/dist/Service";
import {asValue} from "awilix";
import {HealthCheckResult, HealthCheckStatuses} from "@service-t/api/dist/health/HealthCheck";

async function main() {
    const server = await new ServiceTemplate()
      .deps(async () => ({
          mySvc: asValue({
              id: 'mySvc',
              async evaluateHealth(): Promise<HealthCheckResult | HealthCheckResult[]> {
                  console.log('Calling for health check');
                  return {
                      id: 'mySvc',
                      status: HealthCheckStatuses.Unhealthy,
                  }
              }
          }),
      }))
      .registry({
          startables: [],
          stoppables: [],
          crons: [],
          checks: ['mySvc'],
      })
      .initialize();

    await server.start();

    // Hit the health route on the admin server.
    try {
        const {data} = await Axios.get('http://localhost:8081/healthz');
        console.log(data);
    } catch (error) {
        console.log(error.response?.data);
    }

    // await server.stop();
}

main().catch(error => console.error(error));