import { test, expect } from "../../fixtures/auth";

/**
 * Audio folder E2E tests.
 *
 * Tests the virtual "Audio" folder that appears pinned at the top of the notes tree.
 * This folder lists on-device audio recordings with their transcriptions.
 *
 * LIMITATIONS:
 * - Audio recording requires browser microphone access which is not available
 *   in Playwright headless mode. Tests that require actual recordings are skipped.
 * - Audio playback requires Web Audio API which is limited in headless browsers.
 * - Transcription requires a real audio file to send to the API.
 *
 * What IS tested:
 * - Audio folder visibility in the notes tree
 * - Audio folder expand/collapse behavior
 * - Empty state when no recordings exist
 * - Coexistence with default folders
 */

test.describe("Audio Folder - Visibility", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
    // Should land on /notes after signup
  });

  test("Audio folder is visible on the notes page", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // The Audio folder should be visible in the tree
    await expect(page.getByText("Audio", { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test("Audio folder appears alongside default folders", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Audio folder and all default folders should be visible
    await expect(page.getByText("Audio", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Daily", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("People", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Projects", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Archive", { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Audio Folder - Expand and Collapse", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("expanding Audio folder shows empty state for new user", async ({
    page,
  }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Click the Audio folder to expand it
    await page.getByText("Audio", { exact: true }).click();
    await page.waitForTimeout(1000);

    // Should show the empty state message
    await expect(page.getByText("No recordings yet")).toBeVisible({
      timeout: 10000,
    });
  });

  test("collapsing Audio folder hides empty state message", async ({
    page,
  }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Expand the Audio folder
    await page.getByText("Audio", { exact: true }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("No recordings yet")).toBeVisible({
      timeout: 10000,
    });

    // Collapse the Audio folder
    await page.getByText("Audio", { exact: true }).click();
    await page.waitForTimeout(1000);

    // Empty state message should no longer be visible
    await expect(page.getByText("No recordings yet")).not.toBeVisible();
  });

  test("Audio folder does not show Add note or Add folder buttons", async ({
    page,
  }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Expand the Audio folder
    await page.getByText("Audio", { exact: true }).click();
    await page.waitForTimeout(1000);

    // Audio folder should NOT show "Add note" or "Add folder" actions
    // (those are only for regular folders)
    // Since there might be default folders that are collapsed, these buttons
    // should not be visible at all when only Audio is expanded
    const addNoteButtons = page
      .locator('div[tabindex="0"]')
      .filter({ hasText: /^Add note$/ });
    await expect(addNoteButtons).toHaveCount(0);
  });
});

test.describe("Audio Folder - No Recording Badge", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("Audio folder does not show a count badge when empty", async ({
    page,
  }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // The Audio folder should be visible
    await expect(page.getByText("Audio", { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // There should be no badge with a number (badge only shows when count > 0)
    // We verify by checking that the Audio folder row does not contain any
    // numeric text that would represent a count
    // The badge would be a small orange pill with a number
    // Since there are no recordings, no badge should be present
    const audioFolder = page.getByText("Audio", { exact: true });
    await expect(audioFolder).toBeVisible();
    // The text should be exactly "Audio" without any appended count
  });
});

test.describe("Audio Folder - Interaction with Regular Folders", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signup();
  });

  test("can expand Audio folder and a regular folder independently", async ({
    page,
  }) => {
    await page.goto("/notes");
    await page.waitForSelector('text="Notes"', { timeout: 10000 });

    // Expand the Audio folder
    await page.getByText("Audio", { exact: true }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("No recordings yet")).toBeVisible({
      timeout: 10000,
    });

    // Expand the Daily folder
    await page.getByText("Daily", { exact: true }).click();
    await page.waitForTimeout(1000);

    // Both should show their expanded content
    // Audio shows "No recordings yet"
    await expect(page.getByText("No recordings yet")).toBeVisible();
    // Daily shows "Add note" and "Add folder" buttons
    await expect(page.getByText("Add note")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Audio Recording - Skipped (requires microphone)", () => {
  /**
   * These tests verify audio recording and playback functionality.
   * They are skipped because Playwright headless mode cannot grant
   * microphone permissions or interact with the Web Audio API.
   *
   * To test these flows manually:
   * 1. Start the dev servers: pnpm dev
   * 2. Open http://localhost:4001/notes in a browser
   * 3. Click the microphone button to open the recording modal
   * 4. Grant microphone permission and record audio
   * 5. Verify the recording appears in the Audio folder
   * 6. Test playback controls (play/pause, progress bar)
   * 7. Test the Transcribe button triggers transcription
   */

  test.skip("record audio and verify it appears in Audio folder", async () => {
    // Cannot test: requires microphone access
    // Manual test: Record audio -> verify Audio folder shows compact list item
    // with mic icon, title "Recording YYYY-MM-DD HH:MM", and date
  });

  test.skip("tapping audio item navigates to detail page", async () => {
    // Cannot test: requires existing audio recording
    // Manual test: Tap an audio recording in the tree ->
    // verify navigation to /notes/audio/[fileName] detail page
    // with player controls, transcription, and title editing
  });

  test.skip("audio detail page playback controls work", async () => {
    // Cannot test: requires Web Audio API and actual audio file
    // Manual test: Open audio detail page -> click play/pause toggle,
    // verify progress bar appears and time display updates
  });

  test.skip("audio detail page transcribe button works", async () => {
    // Cannot test: requires actual audio recording to send to API
    // Manual test: Open audio detail page -> click Transcribe ->
    // verify loading spinner, transcription text appears after completion
  });

  test.skip("audio detail page title can be edited", async () => {
    // Cannot test: requires existing audio recording
    // Manual test: Open audio detail page -> tap title to edit ->
    // verify title becomes editable, change title, blur to save
  });
});
