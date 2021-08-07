import {asFunction, asClass} from 'awilix';
import {ServiceContext, ServicePlugin} from "@service-t/core/dist/model/Service";
import {PortSchema} from "@service-t/api/dist/common";
import IORedis, {Redis, RedisOptions} from "ioredis";

import Joi from 'joi';

import configFromEnv from "@service-t/core/dist/factories/configFromEnv";
import ServiceTemplate from "@service-t/core/dist/Service";
import HealthCheck, {HealthCheckResult, HealthCheckStatuses} from "@service-t/api/dist/health/HealthCheck";
import Axios from "axios";

type Environment = {
  REDIS_HOST: string,
  REDIS_PORT: number,
}

const EnvironmentSchema = Joi.object<Environment>().keys({
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: PortSchema.default(6379),
}).unknown(true);

type Config = {
  redis: RedisOptions,
}

type Deps = {
  redis: Redis
}

class RedisHealthCheck implements HealthCheck {
    id = 'plugin.redis'

  constructor(protected redis: Redis) {}

  async evaluateHealth(): Promise<HealthCheckResult | HealthCheckResult[]> {
    const receivedBeforeTimeout = await Promise.race([
      this.redis.ping(),
      new Promise(resolve => setTimeout(() => resolve(false), 2000)),
    ])
    return {
      id: 'plugin.redis',
      status: !!receivedBeforeTimeout ? HealthCheckStatuses.Healthy : HealthCheckStatuses.Unhealthy,
      receivedBeforeTimeout,
    }
  }
}

const plugin = {
  name: 'Redis',
  config: configFromEnv<Config, Environment>(EnvironmentSchema, async (env) => ({
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    }
  })),
  deps: async (config) => ({
    redis: asFunction(() => new IORedis(config.redis)).singleton(),
    redisHealthCheck: asClass(RedisHealthCheck).classic().singleton(),
  }),
  registry: {
    startables: [],
    stoppables: [],
    crons: [],
    checks: ['redisHealthCheck']
  }
} as ServicePlugin<Config, Deps>

async function main() {

  const service = await new ServiceTemplate<ServiceContext<Config, Deps>>()
    .addPlugins(plugin)
    .initialize();

  await service.start();

  const { redis } = service.deps;

  await redis.set('hello', 'world');
  const value = await redis.get('hello');
  console.log('KEY:', value);

  try {
    const {data} = await Axios.get('http://localhost:8081/healthz');
    console.log(data);
  } catch (error) {
    console.log(error.response?.data);
  }

  await service.stop();
}

main().catch(error => console.log(error));