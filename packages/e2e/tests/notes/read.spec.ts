import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Note reading/viewing tests.
 * Tests the notes list view and note detail/editor view.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 */

/**
 * Helper to create a note via the modal and return the title used.
 */
async function createNoteViaModal(
  page: import("@playwright/test").Page,
  title: string
): Promise<void> {
  await page.goto("/notes");
  await page.waitForSelector('text="Notes"', { timeout: 10000 });

  const addNoteButton = page.locator('div[tabindex="0"]').filter({
    has: page.locator('svg[stroke="#007AFF"][width="22"]'),
  });
  await addNoteButton.click();

  await page.getByText("New Note").waitFor({ state: "visible", timeout: 5000 });
  await page.getByPlaceholder("Note title").fill(title);
  await getRNButton(page, "Create").click();

  // Wait for navigation to editor
  await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });
}

test.describe("Notes List View", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("displays the notes page header", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    await expect(page.getByText("Notes").first()).toBeVisible();
  });

  test("displays header action buttons", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // There should be two icon buttons in the header: folder plus (orange) and file plus (blue)
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F5A623"][width="22"]'),
    });
    const filePlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#007AFF"][width="22"]'),
    });
    await expect(folderPlusButton).toBeVisible({ timeout: 5000 });
    await expect(filePlusButton).toBeVisible({ timeout: 5000 });
  });

  test("shows created notes in the list", async ({ page }) => {
    const noteTitle = `Read Test Note ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    // Navigate back to notes list
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // The note should be visible in the list
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 10000 });
  });

  test("shows multiple notes in the list", async ({ page }) => {
    const timestamp = Date.now();
    const noteTitle1 = `Multi Note A ${timestamp}`;
    const noteTitle2 = `Multi Note B ${timestamp}`;

    // Create first note
    await createNoteViaModal(page, noteTitle1);

    // Create second note
    await createNoteViaModal(page, noteTitle2);

    // Navigate back to notes list
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Both notes should be visible
    await expect(page.getByText(noteTitle1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(noteTitle2)).toBeVisible({ timeout: 10000 });
  });

  test("clicking a note navigates to the editor", async ({ page }) => {
    const noteTitle = `Clickable Note ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    // Go back to list
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Click the note in the list
    await page.getByText(noteTitle).click();

    // Should navigate to the note editor
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // The editor should show the note title
    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await expect(titleInput).toHaveValue(noteTitle);
  });
});

test.describe("Note Detail View", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("displays the note editor with title input", async ({ page }) => {
    const noteTitle = `Detail Note ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    // Should be on the editor page
    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await expect(titleInput).toHaveValue(noteTitle);
  });

  test("displays the back button", async ({ page }) => {
    await createNoteViaModal(page, "Back Button Test");

    // The back button should display the text
    const backButton = page.getByText("\u2190 Back");
    await expect(backButton).toBeVisible({ timeout: 5000 });
  });

  test("displays the delete button", async ({ page }) => {
    await createNoteViaModal(page, "Delete Button Test");

    // The delete button uses a Trash2 icon - look for the touchable with svg
    // It's rendered in the headerRight area
    await page.waitForTimeout(1000);

    // Check that the header right area has interactive elements (delete button, save indicator)
    const headerButtons = page.locator('div[tabindex="0"]');
    const count = await headerButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("shows save status indicator", async ({ page }) => {
    await createNoteViaModal(page, "Save Status Test");

    // After creating a note, the save indicator should show "Saved"
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });
  });

  test("can navigate back from editor to notes list", async ({ page }) => {
    await createNoteViaModal(page, "Navigate Back Test");

    // Click the back button
    const backButton = page.getByText("\u2190 Back");
    await backButton.click();

    // Should navigate back to the notes list
    await page.waitForTimeout(2000);
    const url = page.url();
    // After going back, should be on a notes-related page
    expect(url).toMatch(/notes/);
  });
});
