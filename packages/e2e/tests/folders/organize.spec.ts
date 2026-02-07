import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Folder organization tests.
 * Tests adding notes to folders and managing folder contents.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 */

test.describe("Folder Organization - Adding Notes to Folders", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
    // Should land on /notes after signup
  });

  test("can create a note inside a folder via the Add note button", async ({
    page,
  }) => {
    const folderName = `Organize Folder ${Date.now()}`;
    const noteTitle = `Folder Note ${Date.now()}`;

    // Create a folder first
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(folderName);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(folderName)).toBeVisible({ timeout: 10000 });

    // Click on the folder to expand it
    const folderItem = page.getByText(folderName);
    await folderItem.click();
    await page.waitForTimeout(1000);

    // Inside the expanded folder, look for the "Add note" button
    await expect(page.getByText("Add note")).toBeVisible({ timeout: 5000 });

    // Click "Add note" inside the folder
    const addNoteButton = page.locator('div[tabindex="0"]').filter({
      hasText: /^Add note$/,
    });
    await addNoteButton.click();

    // The CreateNoteModal should appear
    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Note title").fill(noteTitle);
    await getRNButton(page, "Create").click();

    // Should navigate to the note editor after creation
    await page.waitForURL("**/notes/**", { timeout: 10000 });
  });

  test("can create a subfolder inside a folder via the Add folder button", async ({
    page,
  }) => {
    const parentFolderName = `Parent Folder ${Date.now()}`;
    const subFolderName = `Sub Folder ${Date.now()}`;

    // Create parent folder
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(parentFolderName);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(parentFolderName)).toBeVisible({
      timeout: 10000,
    });

    // Expand the parent folder
    const folderItem = page.getByText(parentFolderName);
    await folderItem.click();
    await page.waitForTimeout(1000);

    // Click "Add folder" inside the expanded folder
    await expect(page.getByText("Add folder")).toBeVisible({ timeout: 5000 });
    const addFolderButton = page.locator('div[tabindex="0"]').filter({
      hasText: /^Add folder$/,
    });
    await addFolderButton.click();

    // The CreateFolderModal should appear
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(subFolderName);
    await getRNButton(page, "Create").click();

    // Wait for the subfolder to appear in the tree
    await page.waitForTimeout(2000);

    // Navigate back to notes to see the tree
    await page.goto("/notes");
    await page.waitForTimeout(2000);

    // Expand the parent folder again
    await expect(page.getByText(parentFolderName)).toBeVisible({
      timeout: 10000,
    });
    await page.getByText(parentFolderName).click();
    await page.waitForTimeout(1000);

    // Subfolder should be visible inside the parent
    await expect(page.getByText(subFolderName)).toBeVisible({ timeout: 10000 });
  });

  test("folder shows Add note and Add folder buttons when expanded", async ({
    page,
  }) => {
    const folderName = `Expandable Folder ${Date.now()}`;

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

    // Before expanding, Add note/Add folder should not be visible
    await expect(page.getByText("Add note")).not.toBeVisible();

    // Expand the folder by clicking on it
    await page.getByText(folderName).click();
    await page.waitForTimeout(1000);

    // After expanding, Add note and Add folder buttons should be visible
    await expect(page.getByText("Add note")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Add folder")).toBeVisible({ timeout: 5000 });
  });

  test("can create a root-level note via the header button", async ({
    page,
  }) => {
    // The file plus button (blue icon) creates root-level notes
    const filePlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#4F46E5"][width="20"]'),
    });

    // Click the file plus button
    await filePlusButton.click();

    // The CreateNoteModal should appear
    await expect(page.getByText("New Note")).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("Note title")).toBeVisible();
  });
});
