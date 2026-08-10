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
    "Displays a single icon, looked up by name from the repository's PNG icon registry, centered in a flex container that fills the widget.",
  type: "workshop",
  parameters: {
    // --- Input parameters ---------------------------------------------------
    // The only configurable value for this widget: the key to look up in the repository's icon
    // registry (src/assets/icons/index.ts). See prompt.txt — this widget intentionally has no
    // size/color/alignment parameters.
    iconName: {
      displayName: "Icon name",
      type: "string",
    },
  },
  events: {},
});
