import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigins = parseCorsOrigins(config.get<string>('CORS_ORIGINS'));
  app.enableCors({ origin: corsOrigins });

  const port = config.get<number>('BACKEND_PORT', 3001);
  await app.listen(port);
}
void bootstrap();
