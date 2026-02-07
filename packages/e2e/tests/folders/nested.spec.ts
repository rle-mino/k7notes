import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Nested folder hierarchy tests.
 * Tests creating multi-level folder structures and expand/collapse behavior.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 */

test.describe("Nested Folder Hierarchy", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
    // Should land on /notes after signup
  });

  test("can create a two-level nested folder structure", async ({ page }) => {
    const parentName = `Parent ${Date.now()}`;
    const childName = `Child ${Date.now()}`;

    // Create parent folder via header button
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(parentName);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(parentName)).toBeVisible({ timeout: 10000 });

    // Expand parent folder
    await page.getByText(parentName).click();
    await page.waitForTimeout(1000);

    // Create child folder via the "Add folder" button inside expanded parent
    await expect(page.getByText("Add folder")).toBeVisible({ timeout: 5000 });
    const addFolderButton = page.locator('div[tabindex="0"]').filter({
      hasText: /^Add folder$/,
    });
    await addFolderButton.click();

    // Fill in the child folder name
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(childName);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);

    // Refresh the page to see the complete tree
    await page.goto("/notes");
    await page.waitForTimeout(2000);

    // Expand parent to see child
    await expect(page.getByText(parentName)).toBeVisible({ timeout: 10000 });
    await page.getByText(parentName).click();
    await page.waitForTimeout(1000);

    // Child folder should be visible
    await expect(page.getByText(childName)).toBeVisible({ timeout: 10000 });
  });

  test("can create a three-level nested folder structure", async ({
    page,
  }) => {
    const level1 = `Level1 ${Date.now()}`;
    const level2 = `Level2 ${Date.now()}`;
    const level3 = `Level3 ${Date.now()}`;

    // Create Level 1 folder via header
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(level1);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(level1)).toBeVisible({ timeout: 10000 });

    // Expand Level 1 and create Level 2
    await page.getByText(level1).click();
    await page.waitForTimeout(1000);
    const addFolderBtn = page.locator('div[tabindex="0"]').filter({
      hasText: /^Add folder$/,
    });
    await addFolderBtn.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(level2);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);

    // Refresh to see updated tree
    await page.goto("/notes");
    await page.waitForTimeout(2000);

    // Expand Level 1
    await expect(page.getByText(level1)).toBeVisible({ timeout: 10000 });
    await page.getByText(level1).click();
    await page.waitForTimeout(1000);

    // Expand Level 2 and create Level 3
    await expect(page.getByText(level2)).toBeVisible({ timeout: 10000 });
    await page.getByText(level2).click();
    await page.waitForTimeout(1000);

    // Look for Add folder inside level 2
    // When both Level 1 and Level 2 are expanded, there are two "Add folder" buttons.
    // The last one belongs to the most deeply nested expanded folder (Level 2).
    const addFolderBtnL2 = page.locator('div[tabindex="0"]').filter({
      hasText: /^Add folder$/,
    });
    await addFolderBtnL2.last().click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(level3);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);

    // Refresh and verify the complete hierarchy
    await page.goto("/notes");
    await page.waitForTimeout(2000);

    // Expand all levels
    await expect(page.getByText(level1)).toBeVisible({ timeout: 10000 });
    await page.getByText(level1).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(level2)).toBeVisible({ timeout: 10000 });
    await page.getByText(level2).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(level3)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Folder Expand and Collapse", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("folder collapses when clicked again after expanding", async ({
    page,
  }) => {
    const folderName = `Toggle Folder ${Date.now()}`;

    // Create a folder
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(folderName);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(folderName)).toBeVisible({ timeout: 10000 });

    // Expand the folder
    await page.getByText(folderName).click();
    await page.waitForTimeout(1000);

    // Add note and Add folder buttons should be visible (expanded state)
    await expect(page.getByText("Add note")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Add folder")).toBeVisible({ timeout: 5000 });

    // Collapse the folder by clicking again
    await page.getByText(folderName).click();
    await page.waitForTimeout(1000);

    // Add note and Add folder buttons should be hidden (collapsed state)
    await expect(page.getByText("Add note")).not.toBeVisible();
    await expect(page.getByText("Add folder")).not.toBeVisible();
  });

  test("collapsing parent folder hides nested children", async ({ page }) => {
    const parentName = `Collapse Parent ${Date.now()}`;
    const childName = `Collapse Child ${Date.now()}`;

    // Create parent folder
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(parentName);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(parentName)).toBeVisible({ timeout: 10000 });

    // Expand parent and create child
    await page.getByText(parentName).click();
    await page.waitForTimeout(1000);
    const addFolderButton = page.locator('div[tabindex="0"]').filter({
      hasText: /^Add folder$/,
    });
    await addFolderButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(childName);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);

    // Refresh to get the full tree state
    await page.goto("/notes");
    await page.waitForTimeout(2000);

    // Expand parent - child should become visible
    await expect(page.getByText(parentName)).toBeVisible({ timeout: 10000 });
    await page.getByText(parentName).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(childName)).toBeVisible({ timeout: 10000 });

    // Collapse parent - child should be hidden
    await page.getByText(parentName).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(childName)).not.toBeVisible();
  });

  test("expanding a folder with content shows its items", async ({ page }) => {
    const folderName = `Content Folder ${Date.now()}`;
    const noteTitle = `Content Note ${Date.now()}`;

    // Create folder
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(folderName);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(folderName)).toBeVisible({ timeout: 10000 });

    // Expand folder and create a note inside it
    await page.getByText(folderName).click();
    await page.waitForTimeout(1000);

    const addNoteButton = page.locator('div[tabindex="0"]').filter({
      hasText: /^Add note$/,
    });
    await addNoteButton.click();
    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Note title").fill(noteTitle);
    await getRNButton(page, "Create").click();

    // Wait for note creation and navigation
    await page.waitForURL("**/notes/**", { timeout: 10000 });

    // Go back to notes list
    await page.goto("/notes");
    await page.waitForTimeout(2000);

    // The note should not be visible when folder is collapsed
    await expect(page.getByText(folderName)).toBeVisible({ timeout: 10000 });

    // Expand folder to see the note
    await page.getByText(folderName).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 10000 });

    // Collapse folder - note should be hidden
    await page.getByText(folderName).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(noteTitle)).not.toBeVisible();
  });
});
