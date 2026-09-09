import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    fileParallelism: false, // Prevent concurrency issues with DB
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
  },
});
