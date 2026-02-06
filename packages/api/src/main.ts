import { env } from "./env.js";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import * as bodyParser from "body-parser";
import helmet from "helmet";

async function bootstrap() {
  // bodyParser: false is CRITICAL for better-auth to read request bodies
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Security headers
  app.use(helmet());

  // Add JSON body parsing for non-auth routes
  // better-auth needs raw bodies, but our API endpoints need parsed JSON
  const expressApp = app.getHttpAdapter().getInstance();

  // Parse JSON with explicit type matching - handles both standard and text content types
  // Increased limit for transcriptions which send base64-encoded audio
  const jsonParser = bodyParser.json({ type: ["application/json", "text/plain"] });
  const largeJsonParser = bodyParser.json({
    type: ["application/json", "text/plain"],
    limit: "25mb", // Allow larger payloads for base64 audio
  });
  expressApp.use("/api/notes", jsonParser);
  expressApp.use("/api/folders", jsonParser);
  expressApp.use("/api/calendar", jsonParser);
  expressApp.use("/api/transcriptions", largeJsonParser);

  // Enable CORS for Expo development and production
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:4001"];

  app.enableCors({
    origin: [
      ...corsOrigins,
      /^exp:\/\/.*/, // Expo dev scheme
      /^k7notes:\/\/.*/, // App deep link scheme
      /\.ngrok-free\.dev$/, // ngrok tunnels for real device testing
    ],
    credentials: true,
  });

  await app.listen(env.PORT);

  console.log(`API server running on http://localhost:${env.PORT}`);
}

bootstrap();
