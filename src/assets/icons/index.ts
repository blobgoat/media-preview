// Repository-owned PNG icon registry.
//
// This maps an icon name (the widget's `iconName` parameter, see src/main.config.ts) to the
// PNG asset URL Vite resolves it to. Entries are generated automatically from whatever `.png`
// files exist in this directory — nothing to hand-maintain.
//
// To register a new icon: drop the `.png` file directly in this folder
// (src/assets/icons/<name>.png). Its filename (without the extension) becomes the `iconName`
// value that resolves to it — e.g. `src/assets/icons/search.png` becomes iconName "search".
// No other file needs to change; src/components/IconDisplay.tsx reads this map by key at
// render time.
//
// `import.meta.glob` is a Vite build-time feature: the glob pattern is evaluated during the
// build (not at runtime in the browser, which couldn't read the filesystem at all), and with
// `eager: true` it compiles down to plain static imports — the exact same output a hand-written
// `import search from "./search.png"` registry would produce, just generated instead of typed
// out by hand. See https://vite.dev/guide/features.html#glob-import.
const iconModules = import.meta.glob("./*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const iconAssets: Record<string, string> = Object.fromEntries(
  Object.entries(iconModules).map(([path, url]) => {
    // "./search.png" -> "search"
    const name = path.replace(/^\.\//, "").replace(/\.png$/, "");
    return [name, url];
  }),
);
