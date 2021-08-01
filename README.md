# Service\<T\>

Pronounced "Service Template", this is a framework for quickly building production-grade services in TypeScript and JavaScript.  The goal is to have developers up and running in hours without having to muck with a bunch of boilerplate.

For instance, the following example demonstrates starting the Service\<T\> kernel, calling the health route, and terminating the server:

```typescript
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
```

Of course, this example is a toy server.



More importantly, Service\<T\> is extensible.  We encourage users to subclass core APIs to provide tailored services for their organization.







