// Repository-owned PNG icon registry.
//
// This maps an icon name (the widget's `iconName` parameter, see src/main.config.ts) to the
// imported PNG asset Vite resolves it to. It ships empty because no PNG files exist in the
// repository yet — the widget must render correctly with zero entries (see prompt.txt's
// "Important Starting-State Requirement" / "No Production Placeholder PNG").
//
// To register a real icon later:
//   1. Place the .png file in this directory (src/assets/icons/).
//   2. Import it below.
//   3. Add one name-to-import entry to `iconAssets`.
//
// For example, once assets exist:
//
//   import search from "./search.png";
//   import calendar from "./calendar.png";
//
//   export const iconAssets: Record<string, string> = {
//     search,
//     calendar,
//   };
//
// No other file needs to change when a new icon is added — src/components/IconDisplay.tsx reads
// this map by key at render time.
export const iconAssets: Record<string, string> = {};
