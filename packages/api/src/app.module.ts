import { Module, Logger } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ORPCModule, ORPCError, onError } from "@orpc/nest";
import { AppController } from "./app.controller.js";
import { DatabaseModule } from "./db/db.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { NotesModule } from "./notes/notes.module.js";
import { FoldersModule } from "./folders/folders.module.js";
import { CalendarModule } from "./calendar/calendar.module.js";
import { TranscriptionsModule } from "./transcriptions/transcriptions.module.js";
import { PreferencesModule } from "./preferences/preferences.module.js";

declare module "@orpc/nest" {
  interface ORPCGlobalContext {
    request: Request;
    headers: Headers;
  }
}

const logger = new Logger("oRPC");

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ name: "default", ttl: 60_000, limit: 60 }],
    }),
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => {
        const headers = new Headers();
        for (const [key, value] of Object.entries(request.headers)) {
          if (value) {
            headers.set(key, Array.isArray(value) ? value.join(", ") : value);
          }
        }
        return {
          context: { request, headers },
          interceptors: [
            onError((error) => {
              if (error instanceof ORPCError) {
                logger.error(
                  `${error.code} (${error.status}): ${error.message}`
                );
              } else if (error instanceof Error) {
                logger.error(error.message);
              }
            }),
          ],
        };
      },
      inject: [REQUEST],
    }),
    DatabaseModule,
    AuthModule,
    NotesModule,
    FoldersModule,
    CalendarModule,
    TranscriptionsModule,
    PreferencesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
