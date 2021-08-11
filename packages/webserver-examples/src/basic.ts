import {WebContext} from "@service-t/webserver/dist";
import {asValue} from "awilix";
import {Request, Response, NextFunction} from "express";

import WebserverTemplate from '@service-t/webserver/dist/Webserver';
import Axios from 'axios';

type Config = {}
type Deps = {
  runFoo: () => Promise<string>
}

async function main() {

  const webserver = await new WebserverTemplate<WebContext<Config, Deps>>()
    .deps(async () => ({
      runFoo: asValue(() => Promise.resolve('bar'))
    }))
    .route({
      method: 'get',
      paths: '/bar',
      async handlers(req: Request,  res: Response, next: NextFunction, deps: Deps) {
        const { runFoo } = deps;
        res.send(await runFoo());
      }
    })
    .addRouter(async (router, ctx) => {
      router.get('/foo', async (req, res) => {
        const { runFoo } = ctx.deps as Deps;
        res.send(await runFoo());
      });
    })
    .initialize();

  await webserver.start();

  const { data: req1Data } = await Axios.get('http://localhost:8080/foo');
  console.log('DATA:', req1Data);

  const { data: req2Data } = await Axios.get('http://localhost:8080/bar');
  console.log('DATA:', req2Data);

  await webserver.stop();
}

main().catch(console.error);
