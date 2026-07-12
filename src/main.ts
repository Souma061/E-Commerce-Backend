import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(); // required for onModuleDestroy to be called.Without this, the PrismaService will not disconnect from the database when the application is terminated.
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
