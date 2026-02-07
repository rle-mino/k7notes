import { z } from "zod";

export const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
export const SupportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

export const UserPreferencesSchema = z.object({
  id: z.string().uuid(),
  appLanguage: SupportedLanguageSchema,
  transcriptionLanguage: SupportedLanguageSchema.nullable(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const GetPreferencesInputSchema = z.object({
  deviceLanguage: SupportedLanguageSchema.optional(),
});
export type GetPreferencesInput = z.infer<typeof GetPreferencesInputSchema>;

export const UpdatePreferencesSchema = z.object({
  appLanguage: SupportedLanguageSchema.optional(),
  transcriptionLanguage: SupportedLanguageSchema.nullable().optional(),
});
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
