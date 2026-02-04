import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Note creation flow tests.
 * Tests creating notes via the CreateNoteModal on the notes index page
 * and via the /notes/new quick-create route.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 */

test.describe("Note Creation via Modal", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("can open create note modal from notes page", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Click the file plus icon button (second header button, blue icon)
    // The first touchable is folder plus, the second is file plus
    const addNoteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#007AFF"][width="22"]'),
    });
    await addNoteButton.click();

    // Modal should appear with "New Note" title
    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("Note title")).toBeVisible();
  });

  test("can create a note with a title", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Open create note modal
    const addNoteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#007AFF"][width="22"]'),
    });
    await addNoteButton.click();

    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });

    // Enter a note title
    const noteTitle = `Test Note ${Date.now()}`;
    await page.getByPlaceholder("Note title").fill(noteTitle);

    // Click Create button
    await getRNButton(page, "Create").click();

    // Should navigate to the note editor
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // The note title should be visible in the editor
    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await expect(titleInput).toHaveValue(noteTitle);
  });

  test("can create a note with empty title (defaults to Untitled)", async ({
    page,
  }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Open create note modal
    const addNoteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#007AFF"][width="22"]'),
    });
    await addNoteButton.click();

    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });

    // Click Create without entering a title
    await getRNButton(page, "Create").click();

    // Should navigate to the note editor (empty title defaults to "Untitled")
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // The title input should show "Untitled"
    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await expect(titleInput).toHaveValue("Untitled");
  });

  test("can cancel note creation", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Open create note modal
    const addNoteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#007AFF"][width="22"]'),
    });
    await addNoteButton.click();

    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });

    // Enter a title
    await page.getByPlaceholder("Note title").fill("Should Not Be Created");

    // Click Cancel
    await getRNButton(page, "Cancel").click();

    // Modal should close
    await expect(page.getByText("New Note")).not.toBeVisible({ timeout: 5000 });

    // Should still be on notes page
    await expect(page).toHaveURL(/.*notes$/);
  });

  test("created note appears in the notes list", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Create a note with a unique title
    const noteTitle = `Listed Note ${Date.now()}`;
    const addNoteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#007AFF"][width="22"]'),
    });
    await addNoteButton.click();

    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Note title").fill(noteTitle);
    await getRNButton(page, "Create").click();

    // Wait for navigation to editor
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Go back to notes list
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // The created note should appear in the list
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Note Creation via /notes/new", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("navigating to /notes/new creates an untitled note", async ({
    page,
  }) => {
    // Navigate to the quick-create route
    await page.goto("/notes/new");

    // Should show "Creating note..." loading state briefly
    // Then redirect to the editor with the new note
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    // The editor should load with "Untitled" as the title
    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await expect(titleInput).toHaveValue("Untitled");
  });
});

test.describe("Note Creation - Empty State", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("shows empty state when no notes exist", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // For a fresh user, the empty state should be visible
    await expect(page.getByText("No notes yet")).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Create your first note or folder to get started.")
    ).toBeVisible();
  });

  test("empty state disappears after creating a note", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Verify empty state is shown
    await expect(page.getByText("No notes yet")).toBeVisible({ timeout: 5000 });

    // Create a note
    const addNoteButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#007AFF"][width="22"]'),
    });
    await addNoteButton.click();

    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Note title").fill("My First Note");
    await getRNButton(page, "Create").click();

    // Wait for navigation to editor
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Go back to notes list
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Empty state should no longer be visible
    await expect(page.getByText("No notes yet")).not.toBeVisible({
      timeout: 5000,
    });

    // The note should appear instead
    await expect(page.getByText("My First Note")).toBeVisible({
      timeout: 10000,
    });
  });
});
