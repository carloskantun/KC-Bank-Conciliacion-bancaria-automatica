import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { StorageService } from './storage.service';

const CHECK_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tiempo de espera agotado (${ms}ms)`));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

@Injectable()
export class MinioHealthIndicator {
  constructor(private readonly storage: StorageService) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await withTimeout(this.storage.checkConnection(), CHECK_TIMEOUT_MS);
      return { [key]: { status: 'up' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new HealthCheckError('MinIO check failed', {
        [key]: { status: 'down', message },
      });
    }
  }
}
