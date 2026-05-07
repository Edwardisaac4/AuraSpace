/**
 * react-router.config.ts — React Router framework configuration.
 *
 * Controls how React Router behaves at the framework level:
 *  - `ssr: true` – Enables server-side rendering (SSR). Pages are rendered
 *    on the server first, then hydrated on the client for faster initial
 *    page loads and better SEO. Set to `false` to run as a pure SPA.
 */

import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
} satisfies Config;
