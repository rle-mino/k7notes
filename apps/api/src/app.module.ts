import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { NotesModule } from "./notes/notes.module";
import { FoldersModule } from "./folders/folders.module";

@Module({
  imports: [AuthModule, NotesModule, FoldersModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
