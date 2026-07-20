import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisHealthIndicator } from './redis.health';

const mockRedisInstance = {
  connect: jest.fn(),
  ping: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockRedisInstance),
  };
});

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: ConfigService,
          useValue: { get: (_key: string, def?: unknown) => def },
        },
      ],
    }).compile();
    indicator = moduleRef.get(RedisHealthIndicator);
  });

  it('reporta "up" cuando Redis responde PONG', async () => {
    mockRedisInstance.connect.mockResolvedValue(undefined);
    mockRedisInstance.ping.mockResolvedValue('PONG');

    const result = await indicator.isHealthy('redis');

    expect(result).toEqual({ redis: { status: 'up' } });
    expect(mockRedisInstance.disconnect).toHaveBeenCalled();
  });

  it('produce un fallo (503 aguas arriba) cuando Redis no puede conectar', async () => {
    mockRedisInstance.connect.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(indicator.isHealthy('redis')).rejects.toMatchObject({
      causes: { redis: { status: 'down' } },
    });
  });

  it('produce un fallo cuando Redis responde algo distinto de PONG', async () => {
    mockRedisInstance.connect.mockResolvedValue(undefined);
    mockRedisInstance.ping.mockResolvedValue('WEIRD');

    await expect(indicator.isHealthy('redis')).rejects.toMatchObject({
      causes: { redis: { status: 'down' } },
    });
  });
});
