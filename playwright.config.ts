import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: process.env.CLINI_FRONTEND_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.CLINI_E2E_BROWSER_PATH ?? "/usr/bin/google-chrome",
      args: ["--no-sandbox"],
    },
  },
});
