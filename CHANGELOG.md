# Changelog

All notable changes to this widget are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Initial scaffold.
- `iconName` widget parameter, a repository-owned PNG icon registry (`src/assets/icons/index.ts`), and an `IconDisplay` component that looks up and renders the matching icon centered in a flex container.
- The icon registry is now generated automatically from the `.png` files present in `src/assets/icons/` via Vite's `import.meta.glob`, instead of a hand-maintained import list.
- When `iconName` is set but doesn't match a registered icon, the widget now shows a small on-widget hint naming the requested value and the currently registered icon names, instead of staying silently blank.
- `iconName` must match a registered icon name exactly (case-sensitive) to render — no fuzzy/case-insensitive resolution.
- When `iconName` is left blank, the widget now shows on-widget guidance ("Enter an icon name to display") with a real example pulled from the registry, instead of staying silently blank.
- When `iconName` doesn't match exactly, the unresolved hint now suggests only the registered names that resemble the typed text ("Did you mean: ..."), rather than always listing every registered icon.
- `iconColor` parameter recolors the icon via a CSS mask (blank = keep the PNG's original colors).
- `shape` parameter (`circle` / `triangle` / `rectangle`) draws a backdrop behind the icon, with `shapeFillColor`, `shapeBorderColor`, `shapeBorderThickness` (% of shape size), and `iconSizePercent` (icon size relative to the shape, default 70%) to configure it. The border is drawn as a uniform inward scale rather than a fixed-pixel inset, so it stays inside the shape for every shape and widget aspect ratio (a pixel inset let the triangle's fill poke outside its border on non-square widgets).
- `backgroundColor` parameter sets the widget's own background color (blank = transparent), applied regardless of whether an icon, the empty-state prompt, or the unresolved-icon hint is showing.
- `shadowEnabled` parameter adds a drop shadow around the widget, which deepens slightly on hover when `hoverAnimationEnabled` is also on.
- `hoverAnimationEnabled` parameter scales the widget up slightly on mouse hover, and down slightly while the mouse button is held on it (tactile press feedback) — one toggle controls both animations, there's no separate parameter for the press. Independent of `iconClicked`; when a press and a hover are both active, the press animation takes precedence.
- `iconClicked` event fires on click anywhere in the widget, regardless of what's currently displayed. Carries no parameter updates.
- `hoverAnimationPaddingPercent` parameter (default 4, only applies when `hoverAnimationEnabled` is on) reserves that percentage of the widget's box as empty padding around the icon/shape/background, so the hover/press scale grows into that space instead of visually overflowing the widget's allocated area. Fixes the hover scale-up rendering outside the widget's bounds — the animated transform now lives on an inner content element clipped by the outer widget's `overflow: hidden`, which an element's own `overflow` can't do for its own transform.
- `shape` now also clips the widget's own animated content box (`backgroundColor`, the shadow, and the hover/press scale target) to match the border/fill shape (circle/triangle), instead of leaving that box a plain rectangle around a circular/triangular icon. `rectangle`, and leaving `shape` unset, are both no-op clips — the content box renders exactly as it always has (the pre-existing unclipped rectangular structure). The icon graphic itself is unaffected either way — it still just centers inside the shape.
- For `shape: "triangle"`, the icon is now anchored to a fixed inset from the base instead of being vertically centered in the bounding box (which looked too high, floating above empty space near the wider base). `iconSizePercent` now grows the triangle's icon upward from that fixed base inset, like a line of text growing upward from a fixed baseline — circle/rectangle are unaffected and still grow outward from the center evenly on all sides.

### Fixed

- `shadowEnabled` had no visible effect at all with `shape: "triangle"` — the triangle's `clip-path` silently clipped the `box-shadow` away entirely, since clip-path restricts all of an element's painting to its shape's interior and a shadow is painted outside the border box. Rendering the shadow as `filter: drop-shadow(...)` instead of `box-shadow` wasn't enough by itself — a filter on the *same* element as `clip-path` still gets clipped away too, since a filter is computed on the element's already-clipped rendered output. The actual fix needed a second piece: for the triangle shape, the animated content box now renders inside a separate, unclipped wrapper element (`icon-widget-shadow-wrapper`) that owns the `filter: drop-shadow(...)` and the hover/press scale transform, while the clipped box underneath keeps only the shape clip and background. Circle and rectangle are unaffected — they never used clip-path, so `box-shadow` on the single content box already worked for them and still does.
