import { Module, Logger } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { ORPCModule, ORPCError, onError } from "@orpc/nest";
import { AppController } from "./app.controller.js";
import { AuthModule } from "./auth/auth.module.js";
import { NotesModule } from "./notes/notes.module.js";
import { FoldersModule } from "./folders/folders.module.js";
import { CalendarModule } from "./calendar/calendar.module.js";

declare module "@orpc/nest" {
  interface ORPCGlobalContext {
    request: Request;
  }
}

const logger = new Logger("oRPC");

@Module({
  imports: [
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => ({
        context: { request },
        interceptors: [
          onError((error) => {
            if (error instanceof ORPCError) {
              logger.error(
                `${error.code} (${error.status}): ${error.message}`,
                error.data ? JSON.stringify(error.data, null, 2) : undefined
              );
            } else if (error instanceof Error) {
              logger.error(error.message, error.stack);
            }
          }),
        ],
      }),
      inject: [REQUEST],
    }),
    AuthModule,
    NotesModule,
    FoldersModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
