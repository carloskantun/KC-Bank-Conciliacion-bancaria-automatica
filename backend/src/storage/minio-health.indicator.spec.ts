import { MinioHealthIndicator } from './minio-health.indicator';
import { StorageService } from './storage.service';

describe('MinioHealthIndicator', () => {
  const buildIndicator = (checkConnection: () => Promise<void>) => {
    const storage = { checkConnection } as unknown as StorageService;
    return new MinioHealthIndicator(storage);
  };

  it('reporta "up" cuando la conexión a MinIO funciona', async () => {
    const indicator = buildIndicator(() => Promise.resolve());

    const result = await indicator.isHealthy('storage');

    expect(result).toEqual({ storage: { status: 'up' } });
  });

  it('reporta "down" cuando MinIO rechaza la conexión, sin bloquearse', async () => {
    const indicator = buildIndicator(() =>
      Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:9000')),
    );

    await expect(indicator.isHealthy('storage')).rejects.toMatchObject({
      causes: { storage: { status: 'down' } },
    });
  });

  it('reporta "down" si la comprobación no responde dentro del tiempo límite', async () => {
    const indicator = buildIndicator(
      () => new Promise(() => undefined), // nunca se resuelve
    );

    await expect(indicator.isHealthy('storage')).rejects.toMatchObject({
      causes: { storage: { status: 'down' } },
    });
  }, 10000);
});
