# Changelog

All notable changes to this widget are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Initial scaffold.
- `iconName` widget parameter, a repository-owned PNG icon registry (`src/assets/icons/index.ts`), and an `IconDisplay` component that looks up and renders the matching icon centered in a flex container.
- The icon registry is now generated automatically from the `.png` files present in `src/assets/icons/` via Vite's `import.meta.glob`, instead of a hand-maintained import list.
- When `iconName` is set but doesn't match a registered icon, the widget now shows a small on-widget hint naming the requested value and the currently registered icon names, instead of staying silently blank.
- `iconName` now falls back to a case-insensitive substring search when there's no exact match (e.g. "cal" or "CALENDAR" both resolve to "calendar").
- `iconColor` parameter recolors the icon via a CSS mask (blank = keep the PNG's original colors).
- `shape` parameter (`circle` / `triangle` / `rectangle`) draws a backdrop behind the icon, with `shapeFillColor`, `shapeBorderColor`, `shapeBorderThickness` (% of shape size), and `iconSizePercent` (icon size relative to the shape, default 70%) to configure it. The border is drawn as a uniform inward scale rather than a fixed-pixel inset, so it stays inside the shape for every shape and widget aspect ratio (a pixel inset let the triangle's fill poke outside its border on non-square widgets).
