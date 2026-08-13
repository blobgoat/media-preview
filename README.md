# media-preview

Scaffolded with `create-palantir-widget.js` from the `@osdk/widget.client` + Vite + React
stack used for Foundry Workshop custom widgets. It uses the Ontology SDK package
`@custom-widget/sdk` with React on top of Vite. The Vite plugin
[`@osdk/widget.vite-plugin`](https://www.npmjs.com/package/@osdk/widget.vite-plugin)
automatically generates a `widgets.config.json` manifest during `npm run build`.

## Media Preview

Displays a single icon, looked up by name from the repository-owned PNG icon registry in `src/assets/icons/index.ts`, centered in a flex container that fills the widget. Configure the `iconName` parameter in Workshop with the exact (case-sensitive) key of a registered icon. Leave it blank and the widget shows guidance with a real example; type something that doesn't match and it suggests registered names that resemble what you typed, rather than guessing or rendering a substitute icon.

Optional parameters: `iconColor` recolors the icon (via a CSS mask; blank keeps the PNG's own colors). `shape` (`circle` / `triangle` / `rectangle`) draws a backdrop behind the icon, styled with `shapeFillColor` and `shapeBorderColor` + `shapeBorderThickness` (a percentage of the shape's size, not px — that's what keeps the border correctly inside the shape on any widget aspect ratio, including a triangle on a wide card). It also clips the widget's own animated content box — the one carrying `backgroundColor`, the shadow, and the hover/press scale — to that same shape, so the click-down/hover affordance itself reads as a circle or triangle instead of staying a rectangle around a circular/triangular icon (`rectangle`, and leaving `shape` unset, both fall back to the same unclipped rectangular box). `iconSizePercent` controls how large the icon renders relative to the shape (default 70%). For circle/rectangle, growing `iconSizePercent` expands the icon outward from the center evenly on all sides. For triangle, the icon is instead anchored to a fixed inset near the base and grows upward from there as `iconSizePercent` increases — like a line of text growing upward from a fixed baseline as its font size increases — since a triangle's usable width is widest near its base and narrows toward the apex, so centering it in the full bounding box would leave it floating above empty space.

The registry is generated automatically from whatever `.png` files exist in `src/assets/icons/` (via Vite's `import.meta.glob`) — to add an icon, just drop the `.png` file in that folder. Its filename without the extension becomes the `iconName` that resolves to it (e.g. `src/assets/icons/search.png` → `iconName: "search"`). Nothing else needs editing. If `iconName` doesn't match any file present, the widget shows a small on-widget hint naming the currently available icons instead of staying silently blank.

Widget-level appearance and interaction, independent of which icon is showing (they also apply to the empty and unresolved-icon hint states): `backgroundColor` sets the widget's own background (blank = transparent). `shadowEnabled` adds a drop shadow, which deepens slightly on hover if `hoverAnimationEnabled` is also on (with `shape: "triangle"`, this renders as a CSS filter instead of a box-shadow under the hood, since the triangle's clip-path would otherwise clip a box-shadow away entirely — visually identical either way). `hoverAnimationEnabled` scales the widget up slightly on mouse hover. When hover animation is on, `hoverAnimationPaddingPercent` (default 4) reserves that percentage of the widget's box as empty padding around the icon/shape/background so the hover scale-up has room to grow into instead of visually spilling past the widget's edges; it's ignored when hover animation is off, so the icon/shape/background still fill the full widget by default. `pressAnimationEnabled` scales the widget down slightly while the mouse button is held on it, as tactile click feedback — independent of `hoverAnimationEnabled` and doesn't need any padding of its own, since shrinking never risks spilling past the widget's edges; if both a hover and a press are active at once, the press wins (same "active beats hover" convention as CSS's own `:active`/`:hover`). The widget also emits an `iconClicked` event on click, regardless of what's currently displayed — wire it to a Workshop action that doesn't need extra data from the click itself (it carries no parameter updates).

The widget's Workshop-facing contract (parameters, events) lives in `src/main.config.ts` via
`defineConfig({...})`. Everything else is ordinary React — `src/Widget.tsx` is the root
component, rendered once `main.tsx` wires up the OSDK client and widget context.

## Pointing this project at your own Foundry project

Two files wire this project to one specific stack and widget set: `.npmrc` (the registry `@custom-widget/sdk` resolves from) and `foundry.config.json` (where `npm run dev` / `npx @osdk/cli widgetset deploy` publish to). Both are **gitignored** and not checked in, since they identify a specific Foundry project/widget set rather than something generic to share — you create your own locally from the checked-in `.example` templates:

```sh
cp .npmrc.example .npmrc
cp foundry.config.json.example foundry.config.json
```

Then fill in the placeholders in each:

1. **Create (or open) your own widget set.** In your Foundry stack, go to the Developer Console's **Custom Widgets** page (or **Workshop → Widgets**) and create a new widget set if you don't already have one. Foundry will show you its RID and the npm registry URL for its generated SDK — you'll need both below.

2. **`.npmrc`** — replace `<your-stack-hostname>` and `<your-widget-set-rid>` with your stack's hostname and your widget set's RID:
   ```
   //<your-stack-hostname>/artifacts/api/:_authToken=${FOUNDRY_TOKEN}
   @custom-widget:registry=https://<your-stack-hostname>/artifacts/api/repositories/<your-widget-set-rid>/contents/release/npm/
   ```

3. **`foundry.config.json`** — replace the same two placeholders, matching the same stack and widget set:
   ```json
   {
     "foundryUrl": "https://<your-stack-hostname>",
     "widgetSet": {
       "rid": "<your-widget-set-rid>",
       "directory": "./dist",
       "autoVersion": { "type": "package-json" }
     }
   }
   ```

4. **Install dependencies** so `@custom-widget/sdk` (and its generated Ontology types, like `$ontologyRid` in `src/client.ts`) resolve from *your* widget set's registry. This needs the same token from [Deploying](#deploying) step 1, since `.npmrc` reads it via `FOUNDRY_TOKEN`:
   ```sh
   export FOUNDRY_TOKEN=<token>
   npm install
   ```

Once these exist and are filled in, the [Developing](#developing) and [Deploying](#deploying) steps below work the same way, just against your own project.

## Developing

Run the following commands (or equivalent with your preferred package manager) to start a local development server and follow the instructions printed to set up developer mode in Foundry:

```sh
export FOUNDRY_TOKEN=<token>
npm run dev
```

> **Note:** A widget no longer needs to be published before you can develop on it. Publishing a widget once (see [Deploying](#deploying)) is still required to use it in Workshop so that it becomes selectable in the **Widget setup** panel.

## Deploying

`foundry.config.json` (create it from `foundry.config.json.example` if you haven't yet — see [Pointing this project at your own Foundry project](#pointing-this-project-at-your-own-foundry-project)) holds the deployment configuration: which stack and widget set to publish to. Once it exists and points at your project, deploying only needs a token plus the steps below.

### 1. Generate a token

1. Sign in to the Foundry stack in a browser (`https://blobfishmaster.usw-18.palantirfoundry.com`).
2. Open your profile menu (top right) and go to **Settings → Tokens** (sometimes labeled **API Tokens** / **Developer Tokens**, depending on your Foundry version).
3. Click **Create Token** (or **Generate Token**), give it a name you'll recognize later (e.g. `widget-deploy`), and copy the value immediately — it's only shown once.

Keep this token secret; treat it like a password. If you ever suspect it's leaked, revoke it from the same Tokens page and generate a new one.

### 2. Connect the OSDK to your account

Export the token as `FOUNDRY_TOKEN` so both local development (`npm run dev`, see [Developing](#developing)) and the build below authenticate as you against the stack in `foundry.config.json`:

```sh
export FOUNDRY_TOKEN=<token>
```

### 3. Build

```sh
npm run build
```

This type-checks the project, produces a production build, and regenerates the `.palantir/widgets.config.json` manifest describing your widgets.

### 4. Deploy

```sh
npx @osdk/cli@latest widgetset deploy --token <token>
```

Use the same token from step 1. This publishes the build to the widget set configured in `foundry.config.json`; once deployed at least once, the widget becomes selectable in Workshop's **Widget setup** panel.

By default the `package-json` strategy is used for determining the version for your widgets from the `version` field in this project's `package.json` file. Remember to update this field and rerun the build command to update the manifest file when deploying a new version.

If you prefer to infer the version from a git tag, you can use the `git-describe` strategy by setting the `autoVersion` field in the `foundry.config.json` file to:

```json
{
  "type": "git-describe",
  "tagPrefix": ""
}
```

## Conventions worth keeping as this grows

- **Workshop's parameter budget**: at most 50 top-level parameters in `main.config.ts`, and
  every `displayName` string is capped at 100 characters. Run `npm run check-params` after
  editing parameters — it parses the whole `parameters: {}` block (not a naive per-line regex)
  and reports the count plus any over-limit or unparseable `displayName`s.
- For a `*Px`-style pixel dimension, a negative number is a common "reset to default" convention
  (a Workshop number field can't be cleared back to blank once set, only overwritten). Unitless
  coefficients usually clamp negative values up to their minimum instead.
- Prefer one enum parameter over several mutually-exclusive booleans describing the same feature —
  cheaper against the 50-param budget and clearer in the setup panel.
- If a parameter needs more explanation than fits in a 100-char `displayName`, add a same-named
  `infoOnX` boolean parameter purely to hold the extra doc text (its value is never read).
- Keep `README.md` (this file) and `CHANGELOG.md` in lockstep with `main.config.ts` — a
  parameter table or event list that's drifted from the code is misleading to whoever configures
  the widget next, in Workshop, with no source in front of them.
- If `vitest`/`esbuild` breaks in a sandboxed environment (a
  `Cannot find module '@rollup/rollup-<platform>'`-style error), that's an environment problem —
  fall back to `npx tsc --noEmit` to verify type-level correctness instead.

## Project structure

```
src/
  main.config.ts   # Workshop-facing contract: parameters + events (defineConfig)
  main.tsx          # Entry point: OSDK client + FoundryWidget + OsdkProvider wiring
  client.ts         # OSDK client construction
  context.ts        # Typed useWidgetContext() hook bound to MainConfig
  Widget.tsx        # Root component — reads parameters, emits iconClicked, renders IconDisplay
  components/       # Presentational pieces split out of Widget.tsx (e.g. IconDisplay.tsx)
  assets/icons/      # Repository-owned PNG icon registry (index.ts) — empty until icons are added
  main.css          # Global styles (html/body/#root height chain, focus rings, etc.)
  __tests__/        # Vitest + Testing Library specs
scripts/
  check-params.cjs  # Parameter-budget checker (npm run check-params)
```
