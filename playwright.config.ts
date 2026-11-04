import { defineConfig, devices } from "@playwright/test";
import { E2E_ADMIN_SECRET } from "./e2e/constants";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

// Never inherit a real DATABASE_URL from the shell. DB-backed specs only run
// when E2E_DATABASE_URL points at a local throwaway Postgres; otherwise the
// server gets an unreachable URL so any accidental DB call fails fast.
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;
if (e2eDatabaseUrl) {
  const host = new URL(e2eDatabaseUrl).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error(
      `E2E_DATABASE_URL must point at a local throwaway database (got host "${host}")`
    );
  }
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${baseURL}/password`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL:
        e2eDatabaseUrl ?? "postgresql://e2e:e2e@127.0.0.1:1/e2e_unreachable",
      DIRECT_URL:
        e2eDatabaseUrl ?? "postgresql://e2e:e2e@127.0.0.1:1/e2e_unreachable",
      ADMIN_SECRET: E2E_ADMIN_SECRET,
    },
  },
});
