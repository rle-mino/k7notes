import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Full-text search tests.
 * Tests the /search page including searching with results,
 * no results, and empty query states.
 *
 * Search is triggered by typing a query and pressing Enter (submit).
 * The search page uses the notes.search oRPC endpoint with PostgreSQL
 * tsvector/tsquery for full-text search with ranking and highlighting.
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

  // Wait for auto-save to complete so the note is persisted and searchable
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 15000 });
}

test.describe("Search - Initial State", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("displays the search page with input field", async ({ page }) => {
    await page.goto("/search");
    await page.waitForTimeout(2000);

    // The search input should be visible
    await expect(page.getByPlaceholder("Search notes...")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows initial empty state before searching", async ({ page }) => {
    await page.goto("/search");
    await page.waitForTimeout(2000);

    // Before any search, should show the prompt message
    await expect(page.getByText("Search your notes")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText("Enter a search term and press return to find notes.")
    ).toBeVisible();
  });

  test("can navigate to search via sidebar", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Click the "Search" link in the sidebar
    const searchLink = page
      .locator('div[tabindex="0"]')
      .filter({ hasText: /^Search$/ });
    await searchLink.click();

    // Should navigate to search page
    await page.waitForURL("**/search**", { timeout: 10000 });
    await expect(page.getByPlaceholder("Search notes...")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Search - With Results", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("finds a note by title", async ({ page }) => {
    const uniqueTitle = `Searchable Elephant ${Date.now()}`;
    await createNoteViaModal(page, uniqueTitle);

    // Navigate to search
    await page.goto("/search");
    await page.waitForTimeout(2000);

    // Type search query and submit
    const searchInput = page.getByPlaceholder("Search notes...");
    await searchInput.fill("Elephant");
    await searchInput.press("Enter");

    // Should find the note
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 15000 });
  });

  test("displays search results with note title", async ({ page }) => {
    const uniqueTitle = `Findable Giraffe ${Date.now()}`;
    await createNoteViaModal(page, uniqueTitle);

    await page.goto("/search");
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder("Search notes...");
    await searchInput.fill("Giraffe");
    await searchInput.press("Enter");

    // The result card should show the note title
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 15000 });
  });

  test("clicking a search result navigates to the note editor", async ({
    page,
  }) => {
    const uniqueTitle = `Clickable Parrot ${Date.now()}`;
    await createNoteViaModal(page, uniqueTitle);

    await page.goto("/search");
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder("Search notes...");
    await searchInput.fill("Parrot");
    await searchInput.press("Enter");

    // Wait for the result to appear
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 15000 });

    // Click on the result
    await page.getByText(uniqueTitle).click();

    // Should navigate to the note editor
    await page.waitForURL(/.*notes\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // The editor should show the note title
    const titleInput = page.getByPlaceholder("Untitled");
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await expect(titleInput).toHaveValue(uniqueTitle);
  });

  test("finds multiple notes matching a query", async ({ page }) => {
    const timestamp = Date.now();
    const titleA = `Zebra Alpha ${timestamp}`;
    const titleB = `Zebra Beta ${timestamp}`;

    await createNoteViaModal(page, titleA);
    await createNoteViaModal(page, titleB);

    await page.goto("/search");
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder("Search notes...");
    await searchInput.fill("Zebra");
    await searchInput.press("Enter");

    // Both notes should appear in results
    await expect(page.getByText(titleA)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(titleB)).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Search - No Results", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("shows no results message for unmatched query", async ({ page }) => {
    await page.goto("/search");
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder("Search notes...");
    await searchInput.fill("xyznonexistent999");
    await searchInput.press("Enter");

    // Should show the no results state
    await expect(page.getByText("No results")).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('No notes found matching "xyznonexistent999"')
    ).toBeVisible();
  });

  test("shows no results for query that does not match any notes", async ({
    page,
  }) => {
    // Create a note with a known title
    await createNoteViaModal(page, `Known Title ${Date.now()}`);

    await page.goto("/search");
    await page.waitForTimeout(2000);

    // Search for something completely different
    const searchInput = page.getByPlaceholder("Search notes...");
    await searchInput.fill("completelyrandomquery");
    await searchInput.press("Enter");

    await expect(page.getByText("No results")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Search - Empty Query", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("clearing search returns to initial state", async ({ page }) => {
    await page.goto("/search");
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder("Search notes...");

    // Type a query and submit
    await searchInput.fill("something");
    await searchInput.press("Enter");

    // Wait for search to complete (either results or no results)
    await page.waitForTimeout(3000);

    // Clear the input and submit again
    await searchInput.fill("");
    await searchInput.press("Enter");

    // Should return to the initial prompt state
    await expect(page.getByText("Search your notes")).toBeVisible({
      timeout: 10000,
    });
  });
});
