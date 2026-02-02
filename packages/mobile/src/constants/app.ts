import Constants from "expo-constants";

/**
 * App scheme from Expo configuration (app.json)
 * Used for deep linking (e.g., "k7notes://calendar/callback")
 */
export const APP_SCHEME = Constants.expoConfig?.scheme ?? "k7notes";

/**
 * Calendar OAuth callback path
 */
export const CALENDAR_CALLBACK_PATH = "calendar/callback";

/**
 * Full calendar callback URL for OAuth redirects
 */
export const CALENDAR_CALLBACK_URL = `${APP_SCHEME}://${CALENDAR_CALLBACK_PATH}`;
