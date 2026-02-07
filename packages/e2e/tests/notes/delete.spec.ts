import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Note deletion tests.
 * Tests deleting notes via the delete button on the [id].tsx editor page.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 *
 * IMPORTANT: React Native Web's Alert.alert() is a no-op - it does nothing.
 * This means the delete confirmation dialog never appears on web, and the
 * delete callback is never invoked. Tests that require actual deletion
 * are skipped until the app implements a web-compatible confirmation dialog
 * (e.g., a custom modal instead of Alert.alert).
 */

/**
 * Helper to create a note via the modal and stay on the editor page.
 */
async function createNoteViaModal(
  page: import("@playwright/test").Page,
  title: string
): Promise<void> {
  await page.goto("/notes");
  await page.waitForSelector('text="Notes"', { timeout: 10000 });

  const addNoteButton = page.locator('div[tabindex="0"]').filter({
    has: page.locator('svg[stroke="#4F46E5"][width="20"]'),
  });
  await addNoteButton.click();

  await page.getByText("New Note").waitFor({ state: "visible", timeout: 5000 });
  await page.getByPlaceholder("Note title").fill(title);
  await getRNButton(page, "Create").click();

  // Wait for navigation to editor
  await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });
  // Wait for editor to load
  await page.getByPlaceholder("Untitled").waitFor({
    state: "visible",
    timeout: 5000,
  });
}

test.describe("Note Deletion", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("delete button is visible in the editor", async ({ page }) => {
    await createNoteViaModal(page, "Delete Visible Test");

    // Wait for the editor to fully load
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

    // The delete button (trash icon with red stroke) should be visible
    const deleteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#DC2626"]'),
    });
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
  });

  // Skipped: Alert.alert is a no-op on React Native Web, so the delete
  // confirmation dialog never appears and deletion cannot be triggered.
  test.skip("can delete a note via confirmation dialog", async ({ page }) => {
    const noteTitle = `Delete Me ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

    const deleteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#DC2626"]'),
    });
    await deleteButton.click();

    // This would require Alert.alert to work on web
    await page.waitForTimeout(3000);

    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    await expect(page.getByText(noteTitle)).not.toBeVisible({ timeout: 5000 });
  });

  // Skipped: Alert.alert is a no-op on React Native Web
  test.skip("can cancel note deletion", async ({ page }) => {
    const noteTitle = `Keep Me ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

    const deleteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#DC2626"]'),
    });
    await deleteButton.click();

    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/.*notes\/[a-zA-Z0-9-]+/);

    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toHaveValue(noteTitle);
  });

  // Skipped: Alert.alert is a no-op on React Native Web
  test.skip("deleted note does not appear in notes list", async ({ page }) => {
    const noteTitle = `Vanishing Note ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 10000 });

    await page.getByText(noteTitle).click();
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });
    await page.getByPlaceholder("Untitled").waitFor({
      state: "visible",
      timeout: 5000,
    });

    const deleteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#DC2626"]'),
    });
    await deleteButton.click();

    await page.waitForTimeout(3000);

    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    await expect(page.getByText(noteTitle)).not.toBeVisible({ timeout: 5000 });
  });

  // Skipped: Alert.alert is a no-op on React Native Web
  test.skip("deleting all notes shows empty state", async ({ page }) => {
    const noteTitle = `Only Note ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

    const deleteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#DC2626"]'),
    });
    await deleteButton.click();

    await page.waitForTimeout(3000);

    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    await expect(page.getByText("No notes yet")).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Create your first note or folder to get started.")
    ).toBeVisible();
  });
});
