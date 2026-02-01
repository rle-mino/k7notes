import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import * as bodyParser from "body-parser";

async function bootstrap() {
  // bodyParser: false is CRITICAL for better-auth to read request bodies
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Add JSON body parsing for non-auth routes
  // better-auth needs raw bodies, but our API endpoints need parsed JSON
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use("/api/notes", bodyParser.json());
  expressApp.use("/api/folders", bodyParser.json());

  // Enable CORS for Expo development and production
  app.enableCors({
    origin: [
      "http://localhost:4001", // Expo web
      "http://localhost:19006", // Expo web alt
      /^exp:\/\/.*/, // Expo dev scheme
      /^k7notes:\/\/.*/, // App deep link scheme
    ],
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`API server running on http://localhost:${port}`);
}

bootstrap();
