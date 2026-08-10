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
    "TODO: describe what this widget does and the parameters an author configures in Workshop.",
  type: "workshop",
  parameters: {
    // --- Input parameters ---------------------------------------------------
    // Example: replace with your widget's real inputs. Workshop authors configure these as
    // fixed values or bind them to Ontology object properties / other widgets' outputs.
    exampleTextInput: {
      displayName: "Example text input — replace with a real parameter",
      type: "string",
    },

    // --- Output / bridge parameters ------------------------------------------
    // Example: a parameter this widget writes to, so Workshop authors can wire other
    // widgets/logic off the interactions happening inside this one.
    lastInteraction: {
      displayName: "Last interaction (example output parameter)",
      type: "string",
    },
  },
  events: {
    // Example: emitting this event updates the parameters listed in parameterUpdateIds. See
    // Widget.tsx's handleExampleClick for how emitEvent is called.
    exampleInteraction: {
      displayName: "Example interaction",
      parameterUpdateIds: ["lastInteraction"],
    },
  },
});
