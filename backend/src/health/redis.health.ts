import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  constructor(private readonly config: ConfigService) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    try {
      await client.connect();
      const pong = await client.ping();
      const isUp = pong === 'PONG';

      if (!isUp) {
        throw new HealthCheckError('Redis check failed', {
          [key]: { status: 'down' },
        });
      }

      return { [key]: { status: 'up' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new HealthCheckError('Redis check failed', {
        [key]: { status: 'down', message },
      });
    } finally {
      client.disconnect();
    }
  }
}
