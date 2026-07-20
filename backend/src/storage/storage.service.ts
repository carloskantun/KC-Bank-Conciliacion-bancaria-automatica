import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class StorageService {
  private readonly client: Client;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.config.get<number>('MINIO_PORT', 9000),
      useSSL: this.config.get<boolean>('MINIO_USE_SSL', false),
      accessKey: this.config.get<string>('MINIO_ROOT_USER', ''),
      secretKey: this.config.get<string>('MINIO_ROOT_PASSWORD', ''),
    });
  }

  getClient(): Client {
    return this.client;
  }

  async checkConnection(): Promise<void> {
    await this.client.listBuckets();
  }
}
