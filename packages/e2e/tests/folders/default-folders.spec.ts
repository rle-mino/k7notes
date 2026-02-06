import { test, expect } from "../../fixtures/auth";

/**
 * Default folder creation tests.
 * Verifies that new users automatically receive the default folder structure
 * (Daily, People, Projects, Archive) upon signup.
 */

const DEFAULT_FOLDER_NAMES = ["Archive", "Daily", "People", "Projects"];

test.describe("Default Folders on Signup", () => {
  test("newly signed-up user sees all 4 default folders on the notes page", async ({
    auth,
    page,
  }) => {
    await auth.signup();

    // After signup, the user lands on /notes. Wait for the page to settle.
    await page.waitForTimeout(2000);

    // Verify each default folder name is visible in the folder tree
    for (const name of DEFAULT_FOLDER_NAMES) {
      await expect(page.getByText(name, { exact: true })).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
