/**
 * routes.ts — Application route configuration.
 *
 * Defines the URL → component mapping for all pages in the app.
 * Uses React Router's file-based routing helpers:
 *  - `index()` – The default route ("/") rendered by `home.tsx`.
 *  - `route()` – A parameterised route ("/visualizer/:id") rendered by `visualizer.$id.tsx`.
 */

import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  /** Home page — the landing page with upload and project gallery. */
  index("routes/home.tsx"),

  /**
   * Visualizer page — shows the AI-generated 3D render for a specific project.
   * The `:id` URL parameter identifies which project to display.
   */
  route("visualizer/:id", "routes/visualizer.$id.tsx"),
] satisfies RouteConfig;
