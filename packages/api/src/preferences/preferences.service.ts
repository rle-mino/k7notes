import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { SupportedLanguage } from "@k7notes/contracts";
import { DB_TOKEN, type Database } from "../db/db.types.js";
import { userPreferences } from "../db/schema.js";

@Injectable()
export class PreferencesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async getOrCreate(userId: string, deviceLanguage?: string) {
    const [existing] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (existing) {
      return {
        id: existing.id,
        appLanguage: existing.appLanguage as SupportedLanguage,
        transcriptionLanguage: existing.transcriptionLanguage as SupportedLanguage | null,
      };
    }

    // Validate and default the device language
    const lang = (deviceLanguage === "fr" ? "fr" : "en") as SupportedLanguage;

    const [created] = await this.db
      .insert(userPreferences)
      .values({ userId, appLanguage: lang })
      .returning();

    return {
      id: created!.id,
      appLanguage: created!.appLanguage as SupportedLanguage,
      transcriptionLanguage: created!.transcriptionLanguage as SupportedLanguage | null,
    };
  }

  async update(userId: string, updates: { appLanguage?: SupportedLanguage; transcriptionLanguage?: SupportedLanguage | null }) {
    // Ensure preferences row exists
    await this.getOrCreate(userId);

    const setData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.appLanguage !== undefined) setData.appLanguage = updates.appLanguage;
    if (updates.transcriptionLanguage !== undefined) setData.transcriptionLanguage = updates.transcriptionLanguage;

    const [updated] = await this.db
      .update(userPreferences)
      .set(setData)
      .where(eq(userPreferences.userId, userId))
      .returning();

    return {
      id: updated!.id,
      appLanguage: updated!.appLanguage as SupportedLanguage,
      transcriptionLanguage: updated!.transcriptionLanguage as SupportedLanguage | null,
    };
  }
}
