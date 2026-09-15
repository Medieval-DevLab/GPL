import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  server: { port: 5173, strictPort: false },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    /**
     * Vitest blanks every `.css` request so a component import cannot drag a stylesheet
     * into a node environment. That also blanks `index.css?raw`, which is how
     * `tokens.test.ts` reads the token declarations. Re-enable the raw query only:
     * Vite's own CSS transform skips `?raw`, so this returns the file as a string and
     * plain `.css` imports stay stubbed.
     */
    css: { include: [/\?raw/] },
  },
});
