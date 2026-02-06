import { Controller, Get } from "@nestjs/common";
import { pool } from "./db/index.js";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health/db")
  async healthDb() {
    try {
      const result = await pool.query("SELECT NOW() as current_time");
      return {
        status: "ok",
        database: "connected",
        timestamp: result.rows[0]?.current_time,
      };
    } catch {
      return {
        status: "error",
        database: "disconnected",
      };
    }
  }
}
