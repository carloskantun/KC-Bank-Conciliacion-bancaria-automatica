import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const mockMinioInstance = {
  listBuckets: jest.fn(),
};

jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => mockMinioInstance),
  };
});

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: { get: (_key: string, def?: unknown) => def },
        },
      ],
    }).compile();
    service = moduleRef.get(StorageService);
  });

  it('resuelve cuando MinIO responde correctamente', async () => {
    mockMinioInstance.listBuckets.mockResolvedValue([]);
    await expect(service.checkConnection()).resolves.toBeUndefined();
  });

  it('propaga el error cuando MinIO no responde', async () => {
    mockMinioInstance.listBuckets.mockRejectedValue(
      new Error('connect ECONNREFUSED'),
    );
    await expect(service.checkConnection()).rejects.toThrow(
      'connect ECONNREFUSED',
    );
  });
});
