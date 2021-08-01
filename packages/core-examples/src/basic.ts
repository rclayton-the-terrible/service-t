import Service from '@service-t/core/dist/Service';

import { asValue } from "awilix";
import {HealthCheckResult, HealthCheckStatuses} from "@service-t/api/dist/health/HealthCheck";

async function main() {

    const server = await new Service()
      .initialize();

    await server.start();

    // setTimeout(() => server.stop(), 3000);
}

main().catch(error => console.error(error));
