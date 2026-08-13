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
    // The key to look up in the repository's icon registry (src/assets/icons/index.ts). Must
    // match a registered name exactly (case-sensitive) — no fuzzy resolution. Left blank, or
    // set to something that doesn't match, the widget shows on-widget guidance instead of
    // guessing.
    iconName: {
      displayName: "Icon name (must match exactly, e.g. a file in src/assets/icons/)",
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
    // blank) renders the icon with no surrounding shape. Also clips the widget's own animated
    // content box (background/shadow/hover-press) to this same shape, not just the border/fill
    // backdrop — "rectangle" is a no-op clip, so it behaves the same as leaving this blank.
    shape: {
      displayName: "Shape of icon area + click/hover box: circle, triangle, or rectangle",
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

    // --- Widget-level appearance ---------------------------------------------
    // CSS color for the widget's own background, behind everything else (icon, shape, hints).
    // Blank = transparent, same as today.
    backgroundColor: {
      displayName: "Widget background color (blank = transparent)",
      type: "string",
    },
    // Adds a drop shadow around the whole widget.
    shadowEnabled: {
      displayName: "Add a drop shadow to the widget",
      type: "boolean",
    },
    // Scales the widget up slightly on mouse hover. Purely a visual affordance; independent of
    // the click event below (hover can be off while clicking still works, and vice versa).
    hoverAnimationEnabled: {
      displayName: "Animate the widget on hover",
      type: "boolean",
    },
    // Percentage of the widget's own box reserved as empty padding so the hover scale-up has
    // room to grow into without spilling outside the widget's allocated area. Only applies when
    // hoverAnimationEnabled is on — otherwise the icon/shape/background fill the full widget,
    // same as before. Defaults to 4 (comfortably covers the ~2%-per-side growth from the current
    // hover scale factor) when hover animation is on but this isn't set.
    hoverAnimationPaddingPercent: {
      displayName: "Padding reserved for hover growth, % of widget size (default 4)",
      type: "number",
    },
    // Scales the widget down slightly while the mouse button is held down on it, as tactile
    // feedback that the click registered. Independent of hoverAnimationEnabled and the
    // iconClicked event below — any combination of the three can be on or off. Uses the same
    // hoverAnimationPaddingPercent reserved space, but shrinking never needs it (only growing —
    // the hover scale-up — risks spilling past the widget's edges).
    // pressAnimationEnabled: {
    //   displayName: "Animate the widget on press (mouse down)",
    //   type: "boolean",
    // },
  },
  events: {
    // Fires whenever the widget is clicked, regardless of what's currently displayed (icon,
    // empty-state prompt, or unresolved-icon hint). Carries no parameter updates of its own —
    // wire it to a Workshop action (run a function, set a variable, etc.) that doesn't need
    // extra data from the click itself.
    iconClicked: {
      displayName: "Widget clicked",
      parameterUpdateIds: [],
    },
  },
});
