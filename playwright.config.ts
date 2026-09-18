import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  outputDir: "test-results/playwright",
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "test-results/report", open: "never" }], ["junit", { outputFile: "test-results/junit.xml" }]]
    : "list",
  use: {
    baseURL: process.env.CLINI_FRONTEND_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Fortaleza",
    launchOptions: process.env.CLINI_E2E_BROWSER_PATH
      ? { executablePath: process.env.CLINI_E2E_BROWSER_PATH, args: ["--no-sandbox"] }
      : { args: ["--no-sandbox"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "mobile-375", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
    { name: "mobile-390", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
