import Axios from 'axios';
import ServiceTemplate from "@service-t/core/dist/Service";

async function main() {
    const server = await new ServiceTemplate().initialize();

    await server.start();

// Hit the health route on the admin server.
    const { data } = await Axios.get('http://localhost:8081/healthz');

    console.log('Health:', data);

    await server.stop();
}

main().catch(error => console.error(error));