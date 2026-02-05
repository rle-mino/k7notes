import { execSync } from "child_process";

/**
 * Global teardown for Playwright tests.
 * Ensures all test servers are stopped after tests complete.
 */
async function globalTeardown() {
  console.log("Cleaning up test servers...");

  try {
    // Kill any processes on port 4000 (API)
    if (process.platform === "win32") {
      execSync('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :4000\') do taskkill /F /PID %a', { stdio: "ignore" });
    } else {
      execSync("lsof -ti :4000 | xargs kill -9 2>/dev/null || true", { stdio: "ignore" });
    }

    // Kill any processes on port 4001 (Web)
    if (process.platform === "win32") {
      execSync('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :4001\') do taskkill /F /PID %a', { stdio: "ignore" });
    } else {
      execSync("lsof -ti :4001 | xargs kill -9 2>/dev/null || true", { stdio: "ignore" });
    }

    console.log("Test servers cleaned up.");
  } catch {
    // Ignore errors - servers may already be stopped
    console.log("Server cleanup completed (some processes may have already exited).");
  }
}

export default globalTeardown;
