import { execSync } from "child_process";

/**
 * Kill processes on a given port, trying graceful SIGTERM first then SIGKILL.
 */
function killPort(port: number) {
  try {
    const pids = execSync(`lsof -ti :${port} 2>/dev/null || true`, {
      encoding: "utf-8",
    }).trim();

    if (!pids) return;

    console.log(`  Killing processes on port ${port} (PIDs: ${pids})`);

    // Graceful shutdown first
    execSync(`echo "${pids}" | xargs kill 2>/dev/null || true`, {
      stdio: "ignore",
    });

    // Wait briefly then force kill any survivors
    execSync("sleep 1", { stdio: "ignore" });
    execSync(`echo "${pids}" | xargs kill -9 2>/dev/null || true`, {
      stdio: "ignore",
    });
  } catch {
    // Ignore - processes may already be gone
  }
}

/**
 * Global teardown for Playwright tests.
 * Ensures all test servers are stopped after tests complete.
 */
async function globalTeardown() {
  console.log("Cleaning up test servers...");
  killPort(4000);
  killPort(4001);
  console.log("Test servers cleaned up.");
}

export default globalTeardown;
