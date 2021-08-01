import Service from '@service-t/core/dist/Service';

async function main() {

    const server = await new Service().initialize();

    await server.start();

    // setTimeout(() => server.stop(), 3000);
}

main().catch(error => console.error(error));
