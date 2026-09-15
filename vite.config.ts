import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Make the built game run from `file://`.
 *
 * `dist/index.html` used to open as a blank white page with four console errors. Two of
 * them are the point: Chromium fetches a `type="module"` script — and anything Vite has
 * tagged `crossorigin` — in CORS mode, and CORS is not available to the `file:` scheme,
 * so both the bundle and the stylesheet were refused before a single pixel rendered.
 * That is the whole reason "here, unzip this and double-click index.html" did not work,
 * and it is the cheapest distribution this game will ever have.
 *
 * The fix is two string edits on the emitted HTML, applied after Vite has written its
 * tags: drop `crossorigin`, and serve the bundle as a deferred classic script instead of
 * a module. `defer` matters — a classic script in `<head>` runs before `<body>` exists,
 * so without it React mounts into nothing.
 *
 * Rejected: `vite-plugin-singlefile`. It is a new dependency for a problem Vite can
 * already solve, and a single file is not achievable here anyway — the game loads 21 WebP
 * photographs from `public/art/` by filename out of content, so the distribution is a
 * folder whatever we do. Inlining the whole bundle into the HTML would also make it
 * uncacheable for the LMS deployment, which is the deployment that matters.
 *
 * The guard below is deliberate. A classic script is only safe while the build is one
 * self-contained chunk; the day someone adds a dynamic import, Rollup will emit a second
 * chunk and `modulepreload` links, and a silently broken file:// build is exactly the
 * kind of failure this item exists to stop.
 */
function fileProtocolDist(): Plugin {
  return {
    name: "gpl-file-protocol-dist",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html) {
      if (html.includes("modulepreload")) {
        throw new Error(
          "gpl-file-protocol-dist: the build emitted a modulepreload link, so it is no " +
            "longer a single chunk and cannot ship as a classic script. Either remove the " +
            "dynamic import, or inline the chunks — and record the choice in " +
            "docs/DECISIONS.md, because it decides whether a zip still works.",
        );
      }
      const scripts = html.match(/<script[^>]*\ssrc=/g) ?? [];
      if (scripts.length !== 1) {
        throw new Error(
          `gpl-file-protocol-dist: expected exactly one external script in the built HTML, found ${scripts.length}.`,
        );
      }
      /* Order: strip the attribute first, then the module type, so this does not depend on
         the order Vite happens to write them in. Then check the work — a silent miss here
         is a blank page for whoever unzips the folder, which is the one failure nobody
         reports back. */
      const rewritten = html
        .replace(/\scrossorigin(?=[\s>])/g, "")
        .replace(/<script\s+type="module"/g, "<script defer");
      /* Comments come out of the shipped HTML entirely. They are 2.5 kB of reasoning that
         belongs in the repository and not in a cohort's download, and taking them out
         first also stops this guard failing the build on its own rationale — `index.html`
         explains at length why `rel=preload`'s `crossorigin` cannot be used here, and the
         first version of this check read that explanation as the thing it bans. */
      const markup = rewritten.replace(/<!--[\s\S]*?-->/g, "").replace(/\n\s*\n/g, "\n");
      if (/type="module"/.test(markup) || /\scrossorigin[\s>=]/.test(markup)) {
        throw new Error(
          "gpl-file-protocol-dist: the built HTML still carries a module script or a " +
            "crossorigin attribute, so it would not open from file://. Vite's output " +
            "shape has changed — update the rewrite.",
        );
      }
      return markup;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fileProtocolDist()],
  base: "./",
  server: { port: 5173, strictPort: false },
  build: {
    /**
     * One chunk, wrapped and in strict mode.
     *
     * `iife` is what lets the bundle run as a classic script: Rollup wraps the whole
     * thing and emits its own `"use strict"`, so nothing leaks onto `window` and the
     * code keeps the semantics it was compiled under. The `es` output happened to
     * contain no `import`/`export` today, which made it look interchangeable — it is
     * not, because module code is strict by default and classic code is not.
     */
    rollupOptions: { output: { format: "iife" } },
    /** Module preload links are meaningless for a classic script, and break the guard. */
    modulePreload: false,
    /**
     * Keep the stylesheet a stylesheet.
     *
     * A non-module output makes Vite give up on emitting a `<link>` and inject the CSS
     * from JavaScript instead, which trades a blocking stylesheet for a flash of
     * unstyled game while the bundle parses. One linked file is also the only version of
     * this the browser can cache separately from the code. Measured: with this set, the
     * iife output is the same size as the default `es` output to within 20 bytes.
     */
    cssCodeSplit: false,
  },
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
