import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { MinioHealthIndicator } from './minio-health.indicator';

@Module({
  providers: [StorageService, MinioHealthIndicator],
  exports: [StorageService, MinioHealthIndicator],
})
export class StorageModule {}
