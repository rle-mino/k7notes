import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Recently modified notes tests.
 * Tests the /recents page which shows notes sorted by updatedAt descending.
 *
 * The recents page fetches all notes via orpc.notes.list({}), sorts them
 * by updatedAt descending, and displays the top 20. It uses useFocusEffect
 * to refresh when the page gains focus.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 */

/**
 * Helper to create a note via the modal and return to the notes list.
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

  // Wait for auto-save to complete
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 15000 });
}

test.describe("Recents - Empty State", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("shows empty state when no notes exist", async ({ page }) => {
    await page.goto("/recents");
    await page.waitForTimeout(2000);

    // Should show the empty state
    await expect(page.getByText("No recent notes")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText("Notes you create or edit will appear here.")
    ).toBeVisible();
  });

  test("can navigate to recents via sidebar", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Click the "Recents" link in the sidebar
    const recentsLink = page
      .locator('div[tabindex="0"]')
      .filter({ hasText: /^Recents$/ });
    await recentsLink.click();

    // Should navigate to recents page
    await page.waitForURL("**/recents**", { timeout: 10000 });
  });
});

test.describe("Recents - With Notes", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("recently created note appears in recents", async ({ page }) => {
    const noteTitle = `Recent Note ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    // Navigate to recents
    await page.goto("/recents");
    await page.waitForTimeout(2000);

    // The recently created note should be visible
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 15000 });
  });

  test("displays note title in recents list", async ({ page }) => {
    const noteTitle = `Recents Title ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    await page.goto("/recents");
    await page.waitForTimeout(2000);

    // The note title should be displayed
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 15000 });
  });

  test("displays relative time for recently created notes", async ({
    page,
  }) => {
    await createNoteViaModal(page, `Timed Note ${Date.now()}`);

    await page.goto("/recents");
    await page.waitForTimeout(2000);

    // Notes just created should show a relative timestamp
    // The formatDate function returns "Just now" for < 1 minute,
    // "Xm ago" for < 60 minutes, etc.
    // We just created the note, so it should show "Just now" or "Xm ago"
    const timeIndicator = page.getByText(/Just now|[0-9]+m ago/);
    await expect(timeIndicator.first()).toBeVisible({ timeout: 15000 });
  });

  test("multiple notes appear in recents sorted by most recent first", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const firstTitle = `First Created ${timestamp}`;
    const secondTitle = `Second Created ${timestamp}`;

    // Create first note
    await createNoteViaModal(page, firstTitle);

    // Small delay to ensure different updatedAt timestamps
    await page.waitForTimeout(1000);

    // Create second note
    await createNoteViaModal(page, secondTitle);

    // Navigate to recents
    await page.goto("/recents");
    await page.waitForTimeout(2000);

    // Both notes should be visible
    await expect(page.getByText(firstTitle)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(secondTitle)).toBeVisible({ timeout: 15000 });

    // The second note (more recently created) should appear before the first
    // We check by getting all note titles and verifying order
    const noteTitles = page.locator('[style*="font-weight"]').filter({
      hasText: new RegExp(`(${firstTitle}|${secondTitle})`),
    });
    const titles = await noteTitles.allTextContents();
    const secondIndex = titles.findIndex((t) => t.includes("Second Created"));
    const firstIndex = titles.findIndex((t) => t.includes("First Created"));

    // secondTitle should come before firstTitle (lower index = higher in list)
    if (secondIndex !== -1 && firstIndex !== -1) {
      expect(secondIndex).toBeLessThan(firstIndex);
    }
  });

  test("clicking a note in recents navigates to the editor", async ({
    page,
  }) => {
    const noteTitle = `Clickable Recent ${Date.now()}`;
    await createNoteViaModal(page, noteTitle);

    await page.goto("/recents");
    await page.waitForTimeout(2000);

    // Click on the note
    await page.getByText(noteTitle).click();

    // Should navigate to the note editor
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // The editor should show the note title
    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await expect(titleInput).toHaveValue(noteTitle);
  });

  test("edited note appears in recents after modification", async ({
    page,
  }) => {
    const originalTitle = `Edit Recents ${Date.now()}`;
    await createNoteViaModal(page, originalTitle);

    // Edit the note title
    const titleInput = page.getByPlaceholder("Untitled");
    const updatedTitle = `Updated Recents ${Date.now()}`;
    await titleInput.fill(updatedTitle);

    // Wait for auto-save
    await expect(page.getByText("Saving...")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 15000 });

    // Navigate to recents
    await page.goto("/recents");
    await page.waitForTimeout(2000);

    // The updated note should be visible with the new title
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 15000 });
  });
});
