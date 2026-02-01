import { Module } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { ORPCModule } from "@orpc/nest";
import { AppController } from "./app.controller.js";
import { AuthModule } from "./auth/auth.module.js";
import { NotesModule } from "./notes/notes.module.js";
import { FoldersModule } from "./folders/folders.module.js";

declare module "@orpc/nest" {
  interface ORPCGlobalContext {
    request: Request;
  }
}

@Module({
  imports: [
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => ({
        context: { request },
      }),
      inject: [REQUEST],
    }),
    AuthModule,
    NotesModule,
    FoldersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
