import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Note update/editing tests.
 * Tests editing note titles and content via the [id].tsx editor page.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
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

test.describe("Note Title Editing", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("can edit a note title", async ({ page }) => {
    const originalTitle = `Original Title ${Date.now()}`;
    await createNoteViaModal(page, originalTitle);

    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toHaveValue(originalTitle);

    // Clear and type a new title
    const updatedTitle = `Updated Title ${Date.now()}`;
    await titleInput.fill(updatedTitle);

    // Verify the title input has the new value
    await expect(titleInput).toHaveValue(updatedTitle);
  });

  test("title changes trigger save indicator", async ({ page }) => {
    await createNoteViaModal(page, "Save Indicator Test");

    // Wait for initial "Saved" state
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

    const titleInput = page.getByPlaceholder("Untitled");

    // Change the title
    await titleInput.fill("Modified Title");

    // The auto-save triggers after 5 seconds, so "Saving..." should appear
    // and then change to "Saved"
    await expect(page.getByText("Saving")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 15000 });
  });

  test("updated title persists after navigating away and back", async ({
    page,
  }) => {
    const originalTitle = `Persist Title ${Date.now()}`;
    await createNoteViaModal(page, originalTitle);

    const titleInput = page.getByPlaceholder("Untitled");

    // Update the title
    const updatedTitle = `Persisted Title ${Date.now()}`;
    await titleInput.fill(updatedTitle);

    // Wait for auto-save to complete
    await expect(page.getByText("Saving")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 15000 });

    // Get the current URL to navigate back to
    const editorUrl = page.url();

    // Navigate away
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // The updated title should appear in the list
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });

    // Navigate back to the note
    await page.goto(editorUrl);

    // The title should still be the updated value
    const reloadedTitle = page.getByPlaceholder("Untitled");
    await expect(reloadedTitle).toBeVisible({ timeout: 5000 });
    await expect(reloadedTitle).toHaveValue(updatedTitle);
  });
});

test.describe("Note Content Editing", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("editor area is visible and editable", async ({ page }) => {
    await createNoteViaModal(page, "Editor Visible Test");

    // The TenTap editor should be present in the page
    // It renders inside a container div; check that the editor area exists
    await page.waitForTimeout(2000);

    // The editor container should be present
    // TenTap uses an iframe or contenteditable div for the editor
    const editorExists =
      (await page.locator('[contenteditable="true"]').count()) > 0 ||
      (await page.locator("iframe").count()) > 0;
    expect(editorExists).toBeTruthy();
  });
});

test.describe("Note Update - Auto Save", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("shows Saved status after initial load", async ({ page }) => {
    await createNoteViaModal(page, "Auto Save Test");

    // The note was just created, so it should show "Saved"
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });
  });

  test("auto-saves title changes after delay", async ({ page }) => {
    await createNoteViaModal(page, "Delay Save Test");

    // Wait for initial "Saved"
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

    // Change the title
    const titleInput = page.getByPlaceholder("Untitled");
    await titleInput.fill("Auto Saved Title");

    // Wait for the auto-save delay (5 seconds) plus some buffer
    // The status should transition: Saving... -> Saved
    await expect(page.getByText("Saving")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 15000 });
  });
});
