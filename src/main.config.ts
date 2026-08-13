import { defineConfig } from "@osdk/widget.client";

// Updates to the widget configuration in this file require reapplying dev mode to preview the
// changes. When developing locally, open the setup URL printed in your terminal again. When
// developing in Code Workspaces, refresh the preview panel.
//
// Two hard, silent Workshop limits on this file's `parameters` object: at most 50 top-level
// parameters, and every displayName capped at 100 characters. Run `npm run check-params` after
// editing this file — see README.md and scripts/check-params.js.

export default defineConfig({
  id: "mediaPreview",
  name: "Media Preview",
  description:
    "Displays a single icon, looked up by name from the repository's PNG icon registry, centered in a flex container that fills the widget. Optionally recolor the icon and/or wrap it in a circle, triangle, or rectangle.",
  type: "workshop",
  parameters: {
    // --- Input parameters ---------------------------------------------------
    // The key to look up in the repository's icon registry (src/assets/icons/index.ts). Exact
    // match wins; otherwise falls back to a case-insensitive substring search.
    iconName: {
      displayName: "Icon name",
      type: "string",
    },
    // CSS color to recolor the icon to (e.g. "#2563eb", "royalblue"). Leave blank to keep the
    // PNG's own original colors. Recoloring uses a CSS mask, so it only makes sense for
    // single-color/silhouette icons with a transparent background.
    iconColor: {
      displayName: "Icon color (blank = original PNG colors)",
      type: "string",
    },
    // One of "circle", "triangle", or "rectangle" (case-insensitive). Any other value (or
    // blank) renders the icon with no surrounding shape.
    shape: {
      displayName: "Shape around icon: circle, triangle, or rectangle",
      type: "string",
    },
    shapeFillColor: {
      displayName: "Shape fill color (blank = transparent)",
      type: "string",
    },
    shapeBorderColor: {
      displayName: "Shape border color (blank = no border)",
      type: "string",
    },
    // Percentage (not px) of the shape's own size — see IconDisplay.tsx's doc comment on
    // shapeBorderThickness for why this needs to be a percentage/uniform-scale rather than a
    // fixed px inset (a fixed px inset doesn't stay inside a triangle on a non-square widget).
    shapeBorderThickness: {
      displayName: "Shape border thickness, % of shape size (default 8 if border color set)",
      type: "number",
    },
    // Percentage of the shape's box the icon itself should fill. Only applies when `shape` is
    // set. Higher = icon looms larger relative to the shape backdrop.
    iconSizePercent: {
      displayName: "Icon size, % of shape (only with a shape set; default 70)",
      type: "number",
    },
  },
  events: {},
});
