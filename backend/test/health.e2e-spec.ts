import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { HealthController } from '../src/health/health.controller';
import { RedisHealthIndicator } from '../src/health/redis.health';
import { MinioHealthIndicator } from '../src/storage/minio-health.indicator';
import { StorageService } from '../src/storage/storage.service';

// Se mockean únicamente los clientes de bajo nivel (ioredis, minio) para no
// depender de infraestructura real en CI. La lógica de los indicadores, del
// HealthController y de HealthCheckService se ejecuta de forma real.

const mockRedisInstance = {
  connect: jest.fn(),
  ping: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockRedisInstance),
}));

const mockMinioInstance = {
  listBuckets: jest.fn(),
};

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => mockMinioInstance),
}));

interface HealthResponseBody {
  status: string;
  details: Record<string, { status: string; message?: string }>;
}

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  const CORS_ORIGIN = 'http://localhost:3000';

  const fakeDataSource = {
    options: { type: 'postgres' },
    query: jest.fn(),
  };

  beforeAll(async () => {
    mockRedisInstance.connect.mockResolvedValue(undefined);
    mockRedisInstance.ping.mockResolvedValue('PONG');
    mockMinioInstance.listBuckets.mockResolvedValue([]);
    fakeDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        RedisHealthIndicator,
        StorageService,
        MinioHealthIndicator,
        { provide: DataSource, useValue: fakeDataSource },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, def?: unknown) => def },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableCors({ origin: [CORS_ORIGIN] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockRedisInstance.connect.mockResolvedValue(undefined);
    mockRedisInstance.ping.mockResolvedValue('PONG');
    mockMinioInstance.listBuckets.mockResolvedValue([]);
    fakeDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('GET /health responde 200 cuando Postgres, Redis y MinIO están arriba', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    const body = res.body as HealthResponseBody;

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.details.database.status).toBe('up');
    expect(body.details.redis.status).toBe('up');
    expect(body.details.storage.status).toBe('up');
  });

  it('GET /health/database responde 200 cuando Postgres responde', async () => {
    const res = await request(app.getHttpServer()).get('/health/database');
    const body = res.body as HealthResponseBody;

    expect(res.status).toBe(200);
    expect(body.details.database.status).toBe('up');
  });

  it('GET /health/redis responde 200 cuando Redis responde', async () => {
    const res = await request(app.getHttpServer()).get('/health/redis');
    const body = res.body as HealthResponseBody;

    expect(res.status).toBe(200);
    expect(body.details.redis.status).toBe('up');
  });

  it('GET /health/storage responde 200 cuando MinIO responde', async () => {
    const res = await request(app.getHttpServer()).get('/health/storage');
    const body = res.body as HealthResponseBody;

    expect(res.status).toBe(200);
    expect(body.details.storage.status).toBe('up');
  });

  it('GET /health/redis responde 503 cuando Redis está caído', async () => {
    mockRedisInstance.connect.mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await request(app.getHttpServer()).get('/health/redis');
    const body = res.body as HealthResponseBody;

    expect(res.status).toBe(503);
    expect(body.details.redis.status).toBe('down');
  });

  it('GET /health/storage responde 503 cuando MinIO está caído', async () => {
    mockMinioInstance.listBuckets.mockRejectedValue(
      new Error('connect ECONNREFUSED 127.0.0.1:9000'),
    );

    const res = await request(app.getHttpServer()).get('/health/storage');
    const body = res.body as HealthResponseBody;

    expect(res.status).toBe(503);
    expect(body.details.storage.status).toBe('down');
  });

  it('GET /health responde 503 si alguna dependencia falla', async () => {
    mockMinioInstance.listBuckets.mockRejectedValue(new Error('down'));

    const res = await request(app.getHttpServer()).get('/health');
    const body = res.body as HealthResponseBody;

    expect(res.status).toBe(503);
    expect(body.status).toBe('error');
  });

  it('CORS permite el origen configurado', async () => {
    const res = await request(app.getHttpServer())
      .options('/health')
      .set('Origin', CORS_ORIGIN)
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe(CORS_ORIGIN);
  });

  it('CORS rechaza un origen distinto al configurado', async () => {
    const res = await request(app.getHttpServer())
      .options('/health')
      .set('Origin', 'http://evil.example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
