import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Folder creation flow tests.
 * Tests creating folders via the CreateFolderModal on the notes page.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 */

test.describe("Folder Creation", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
    // Should land on /notes after signup
  });

  test("can open the create folder modal from header button", async ({
    page,
  }) => {
    // The header has two icon buttons: folder plus (orange) and file plus (blue)
    // The folder plus button is the first one in headerActions
    // Since these are icon-only buttons, we locate them by their position
    // Click the folder plus button (orange icon)
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();

    // The CreateFolderModal should appear with "New Folder" title
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("Folder name")).toBeVisible();
    await expect(page.getByText("Cancel")).toBeVisible();
    // The "Create" button text is present but may not have tabindex="0" when disabled (empty name)
    // Use exact matching to avoid matching "Create your first note or folder to get started."
    await expect(page.getByText("Create", { exact: true })).toBeVisible();
  });

  test("can create a folder successfully", async ({ page }) => {
    const folderName = `Test Folder ${Date.now()}`;

    // Open folder creation modal via header button
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();

    // Wait for modal
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });

    // Type folder name
    await page.getByPlaceholder("Folder name").fill(folderName);

    // Click Create
    await getRNButton(page, "Create").click();

    // Modal should close and folder should appear in the tree view
    await page.waitForTimeout(2000);
    await expect(page.getByText(folderName)).toBeVisible({ timeout: 10000 });
  });

  test("shows validation error for empty folder name", async ({ page }) => {
    // Open folder creation modal
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();

    // Wait for modal
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });

    // Try to submit without entering a name by pressing Enter in the input
    // (The Create button is disabled when name is empty, but the TextInput
    // has onSubmitEditing which calls handleCreate and shows the validation error)
    await page.getByPlaceholder("Folder name").press("Enter");

    // Should show validation error
    await page.waitForTimeout(500);
    await expect(page.getByText("Please enter a folder name")).toBeVisible();
  });

  test("can cancel folder creation", async ({ page }) => {
    // Open folder creation modal
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();

    // Wait for modal
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });

    // Type a name
    await page.getByPlaceholder("Folder name").fill("Should Not Be Created");

    // Click Cancel
    await getRNButton(page, "Cancel").click();

    // Modal should close - "New Folder" title should no longer be visible
    await expect(page.getByText("New Folder")).not.toBeVisible({
      timeout: 5000,
    });

    // The folder name should not appear in the tree
    await expect(page.getByText("Should Not Be Created")).not.toBeVisible();
  });

  test("can create multiple folders", async ({ page }) => {
    const folder1 = `Folder A ${Date.now()}`;
    const folder2 = `Folder B ${Date.now()}`;

    // Create first folder
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(folder1);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(folder1)).toBeVisible({ timeout: 10000 });

    // Create second folder
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill(folder2);
    await getRNButton(page, "Create").click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(folder2)).toBeVisible({ timeout: 10000 });

    // Both folders should be visible
    await expect(page.getByText(folder1)).toBeVisible();
    await expect(page.getByText(folder2)).toBeVisible();
  });

  test("resets modal state on reopen", async ({ page }) => {
    // Open modal and type something
    const folderPlusButton = page.locator('div[tabindex="0"]').filter({
      has: page.locator('svg[stroke="#F59E0B"][width="20"]'),
    });
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("Folder name").fill("Some Text");

    // Cancel
    await getRNButton(page, "Cancel").click();
    await expect(page.getByText("New Folder")).not.toBeVisible({
      timeout: 5000,
    });

    // Reopen - input should be empty
    await folderPlusButton.click();
    await expect(page.getByText("New Folder")).toBeVisible({ timeout: 5000 });
    const input = page.getByPlaceholder("Folder name");
    await expect(input).toHaveValue("");
  });
});
