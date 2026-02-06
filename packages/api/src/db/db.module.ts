import { Global, Module } from "@nestjs/common";
import { DB_TOKEN } from "./db.types.js";
import { db } from "./index.js";

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      useValue: db,
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
