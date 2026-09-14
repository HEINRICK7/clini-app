import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    clearMocks: true,
    exclude: ["**/node_modules/**", "**/.next/**", "tests/**"],
    restoreMocks: true,
  },
});
