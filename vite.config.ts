/**
 * vite.config.ts — Vite build configuration for AuraSpace.
 *
 * Plugins:
 *  - `@tailwindcss/vite` – Processes Tailwind CSS utility classes at build time.
 *  - `@react-router/dev/vite` – Enables React Router's dev-server integration
 *    (file-based routing, HMR, SSR support).
 *
 * Resolve:
 *  - `tsconfigPaths: true` – Allows importing via the `~` path alias
 *    defined in `tsconfig.json` (e.g. `import X from "~/components/X"`).
 */

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
