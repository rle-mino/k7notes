import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  // bodyParser: false is CRITICAL for better-auth to read request bodies
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Enable CORS for Expo development and production
  app.enableCors({
    origin: [
      "http://localhost:8081", // Expo web
      "http://localhost:19006", // Expo web alt
      /^exp:\/\/.*/, // Expo dev scheme
      /^k7notes:\/\/.*/, // App deep link scheme
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`API server running on http://localhost:${port}`);
}

bootstrap();
