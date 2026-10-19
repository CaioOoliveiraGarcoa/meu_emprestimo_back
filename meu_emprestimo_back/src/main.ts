import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers via helmet (ADR-001)
  app.use(helmet());

  // CORS configuration (ADR-001)
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global prefix v1, excluding root '/' (ADR-001)
  app.setGlobalPrefix('v1', {
    exclude: ['/'],
  });

  // Input validation with Zod (ADR-001)
  app.useGlobalPipes(new ZodValidationPipe());

  // Clean lifecycle & graceful shutdown (typescript-services skill)
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`EMPREST.AI-Back running on http://localhost:${port}/`);
}

bootstrap();
