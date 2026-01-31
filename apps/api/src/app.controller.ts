import { Controller, Get } from "@nestjs/common";
import { pool } from "./db";

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
    } catch (error) {
      return {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
