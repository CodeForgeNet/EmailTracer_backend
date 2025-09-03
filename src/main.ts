import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS: Restrict in production, allow all in dev
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',') // e.g. "https://myfrontend.com,https://admin.myfrontend.com"
      : '*', // fallback: allow all (for local/dev)
    credentials: true,
  });

  // ✅ Port: Render/Heroku assign dynamically
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // ✅ Bind to all interfaces (important for cloud deployment)
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
}
bootstrap();
