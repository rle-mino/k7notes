import { test as base, Page, Locator } from "@playwright/test";
import { DEFAULT_TEST_USER, generateTestId } from "../utils/seed";

// ============================================================================
// React Native Web Helpers
// ============================================================================

/**
 * React Native Web renders TouchableOpacity as div[tabindex="0"] instead of button elements.
 * This helper creates a locator that works with RN Web "buttons".
 */
export function getRNButton(page: Page, text: string): Locator {
  // Use exact match with regex to avoid partial matches
  return page.locator('div[tabindex="0"]').filter({ hasText: new RegExp(`^${text}$`) });
}

/**
 * Authentication helpers for e2e tests.
 *
 * Provides fixtures for common auth operations:
 * - signup: Register a new user via the UI
 * - login: Sign in an existing user via the UI
 * - logout: Sign out the current user via the UI
 */

// ============================================================================
// Types
// ============================================================================

export interface AuthFixture {
  /**
   * Sign up a new user via the signup form.
   * @returns The credentials used to create the account
   */
  signup: (options?: {
    name?: string;
    email?: string;
    password?: string;
  }) => Promise<{ name: string; email: string; password: string }>;

  /**
   * Log in an existing user via the login form.
   * @param email - User email
   * @param password - User password
   */
  login: (email: string, password: string) => Promise<void>;

  /**
   * Log out the current user via the settings page.
   */
  logout: () => Promise<void>;

  /**
   * Check if the user is currently authenticated by looking for auth indicators.
   */
  isAuthenticated: () => Promise<boolean>;

  /**
   * Navigate to the login page.
   */
  goToLogin: () => Promise<void>;

  /**
   * Navigate to the signup page.
   */
  goToSignup: () => Promise<void>;

  /**
   * Navigate to the settings page (requires authentication).
   */
  goToSettings: () => Promise<void>;

  /**
   * Generate unique test credentials for signup.
   */
  generateCredentials: () => {
    name: string;
    email: string;
    password: string;
  };
}

// ============================================================================
// Auth Page Helpers
// ============================================================================

/**
 * Navigate to the login page.
 */
async function goToLogin(page: Page): Promise<void> {
  await page.goto("/login");
  // Wait for the page to be ready
  await page.waitForSelector('text="Sign in to continue"', { timeout: 10000 });
}

/**
 * Navigate to the signup page.
 */
async function goToSignup(page: Page): Promise<void> {
  await page.goto("/signup");
  // Wait for the page to be ready
  await page.waitForSelector('text="Sign up to get started"', { timeout: 10000 });
}

/**
 * Navigate to the settings page.
 */
async function goToSettings(page: Page): Promise<void> {
  await page.goto("/settings");
  // Wait for the page to be ready
  await page.waitForSelector('text="Account"', { timeout: 10000 });
}

/**
 * Sign up a new user using the signup form.
 */
async function signup(
  page: Page,
  options: { name?: string; email?: string; password?: string } = {}
): Promise<{ name: string; email: string; password: string }> {
  const timestamp = Date.now();
  const credentials = {
    name: options.name || `Test User ${timestamp}`,
    email: options.email || `e2e-test-${timestamp}@example.com`,
    password: options.password || DEFAULT_TEST_USER.password,
  };

  // Navigate to signup if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes("/signup")) {
    await goToSignup(page);
  }

  // Fill the form
  await page.getByPlaceholder("Full Name").fill(credentials.name);
  await page.getByPlaceholder("Email").fill(credentials.email);
  await page.getByPlaceholder("Password (min 8 characters)").fill(credentials.password);

  // Submit the form - React Native Web renders TouchableOpacity as div[tabindex="0"]
  const createBtn = page.locator('div[tabindex="0"]').filter({ hasText: /^Create Account$/ });

  // Wait for the button to be ready and click with retry logic
  // Under parallel test load, clicks can fail to register
  for (let attempt = 0; attempt < 3; attempt++) {
    await createBtn.click();
    try {
      await page.waitForURL("**/notes**", { timeout: 15000 });
      break;
    } catch {
      // If still on signup page, retry the click
      if (!page.url().includes("/signup")) {
        // Already navigated somewhere, wait longer
        await page.waitForURL("**/notes**", { timeout: 15000 });
        break;
      }
    }
  }

  return credentials;
}

/**
 * Log in an existing user using the login form.
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  // Navigate to login if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes("/login")) {
    await goToLogin(page);
  }

  // Fill the form
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);

  // Submit the form - React Native Web renders TouchableOpacity as div[tabindex="0"]
  const signInBtn = page.locator('div[tabindex="0"]').filter({ hasText: /^Sign In$/ });
  await signInBtn.click();

  // Wait for navigation to notes page (indicates successful login)
  // Retry the click if we're still on the login page after a brief wait
  try {
    await page.waitForURL("**/notes**", { timeout: 10000 });
  } catch {
    await signInBtn.click();
    await page.waitForURL("**/notes**", { timeout: 30000 });
  }
}

/**
 * Log out the current user.
 *
 * Uses the sign-out API directly because the settings page Sign Out button
 * is inside a React Native ScrollView, and RN Web's TouchableOpacity click
 * handling has issues with scrolled elements in automated tests.
 * After signing out server-side, we clear browser cookies and navigate to login.
 */
async function logout(page: Page): Promise<void> {
  // Call the sign-out API to invalidate the session server-side
  await page.evaluate(async () => {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
  });

  // Clear all cookies so the client doesn't retain the session
  const context = page.context();
  await context.clearCookies();

  // Navigate to login page
  await page.goto("/login");
  await page.waitForSelector('text="Sign in to continue"', { timeout: 10000 });
}

/**
 * Check if user is authenticated by checking for authenticated UI elements.
 */
async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Try to navigate to a protected route
    await page.goto("/notes", { timeout: 5000 });
    await page.waitForTimeout(1000);

    // If we're still on notes page, we're authenticated
    const url = page.url();
    return url.includes("/notes") && !url.includes("/login");
  } catch {
    return false;
  }
}

/**
 * Generate unique credentials for test signup.
 */
function generateCredentials(): {
  name: string;
  email: string;
  password: string;
} {
  const id = generateTestId("e2e");
  return {
    name: `Test User ${id}`,
    email: `${id}@example.com`,
    password: DEFAULT_TEST_USER.password,
  };
}

// ============================================================================
// Auth Test Fixture
// ============================================================================

/**
 * Extended test fixture with authentication helpers.
 * Use this for tests that need to interact with auth flows.
 */
export const test = base.extend<{ auth: AuthFixture }>({
  auth: async ({ page }, use) => {
    const authFixture: AuthFixture = {
      signup: (options) => signup(page, options),
      login: (email, password) => login(page, email, password),
      logout: () => logout(page),
      isAuthenticated: () => isAuthenticated(page),
      goToLogin: () => goToLogin(page),
      goToSignup: () => goToSignup(page),
      goToSettings: () => goToSettings(page),
      generateCredentials,
    };

    await use(authFixture);
  },
});

export { expect } from "@playwright/test";
