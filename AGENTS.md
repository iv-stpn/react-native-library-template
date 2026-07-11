# Agent guide

Monorepo for a publishable React Native UI library. Bun workspaces:

| Workspace | Package | Purpose |
| --- | --- | --- |
| `packages/ui` | `@template/ui` | The library. Versioned by changesets but `private` (see [Releasing](#releasing)). |
| `storybook/web` | `@template/storybook-web` | Web Storybook (react-native-web + Vite) and Storybook tests (Vitest browser mode). |
| `storybook/native` | `@template/example` | Expo app running Storybook React Native on device. |

Tooling: **bun** (package manager + script runner), **biome** (lint + format), **TypeScript 6**
(strict, `verbatimModuleSyntax` — use `import type` for types), **vitest** (story tests via
`@storybook/addon-vitest` in Chromium, and the runner behind on-device component tests via
[`vitest-mobile`](https://github.com/phantom/vitest-mobile) — real React Native views + real
touch events on a booted simulator/emulator; see [Testing](#testing)),
**react-native-builder-bob** (library build), **changesets** (versioning/publishing),
**husky** (git hooks — a `pre-commit` hook runs lint, typecheck, and the device-free tests). Components are
styled with **[Uniwind](https://uniwind.dev)** (Tailwind CSS 4 `className` for React Native) plus
**[cva](https://cva.style)** for variants — see [Styling](#styling-uniwind).

## Commands (run from the repo root)

| Command | What it does |
| --- | --- |
| `bun install` | Install all workspaces. |
| `bun run lint` / `bun run lint:fix` | Biome check / autofix. |
| `bun run typecheck` | `tsc --noEmit` in every workspace. |
| `bun run test:storybook` | Runs every story as a Vitest browser test (needs `bunx playwright install chromium` once). |
| `bun run test` | Alias for `test:storybook` (the only device-free suite). |
| `bun run test:native:ios` / `test:native:android` | On-device component tests via `vitest-mobile`. Normally run by CI, not locally — see [Testing](#testing). |
| `bun run build` | Builds the library with bob into `packages/ui/lib`. |
| `bun run storybook` | Web Storybook at http://localhost:6006. |
| `bun run storybook:native` | Expo dev server for the on-device Storybook. |
| `bun run changeset` | Record a changeset for release notes/versioning. |

## Creating a new component

Follow the `Button` component (`packages/ui/src/components/Button/`) as the reference
implementation. For a component named `Foo`:

1. **Create the folder** `packages/ui/src/components/Foo/` containing exactly:
   - `foo.tsx` — the component.
   - `foo.stories.tsx` — Storybook stories (CSF3), including at least one `play` function.

   The on-device test lives separately in `storybook/native/tests/` (step 5), **not** in this
   folder — `vitest-mobile` discovers tests via `require.context(appDir, …)` rooted at the
   native app, which cannot reach up into `packages/ui`.

   **No `index.ts`** — barrel files are forbidden everywhere in the library. Public entry
   points are declared in the `exports` map of `packages/ui/package.json` (step 3), and
   internal imports always target the concrete file (`../../components/Button/button`), never a folder.
2. **Write the component** (`foo.tsx`):
   - Named function export (`export function Foo(...)`), never a default export.
   - Export a `FooProps` interface with a JSDoc comment per prop; document defaults with `@default`.
   - Only import from `react`, `react-native`, and internal modules. New runtime dependencies
     need explicit approval — they become dependencies for every consumer of the library.
   - Prefer RN APIs that exist on react-native-web (`View`, `Text`, `Pressable`, ...) so the
     web Storybook renders; the on-device tests run on real `react-native` and do not need this.
   - Style with Tailwind `className` (resolved by [Uniwind](https://uniwind.dev)) — no
     `StyleSheet.create`, no hard-coded colors or magic numbers. Compose variants with
     [`class-variance-authority`](https://cva.style) (`cva`), following `Button` as the
     reference. Keep class strings as static literals so Tailwind's scanner can see them.
     `View`/`Text`/`Pressable` take `className`; `ActivityIndicator` takes `colorClassName`
     (see the full prop list in `uniwind/types`). Still accept a `style` prop for escape-hatch
     overrides.
   - Accessibility is required: set `accessibilityRole`, `accessibilityState`, and accept an
     `accessibilityLabel` prop. Also accept `style` (as `StyleProp<...>`) and `testID`.
3. **Export it from the library**: add a `./foo` subpath to the `exports` map in
   `packages/ui/package.json`, mirroring the existing `./button` entry:
   ```json
   "./foo": {
     "source": "./src/components/Foo/foo.tsx",
     "types": "./lib/typescript/components/Foo/foo.d.ts",
     "default": "./lib/module/components/Foo/foo.js"
   }
   ```
   Consumers then use `import { Foo } from '@template/ui/foo'`. There is no root entry
   point and no `src/index.ts` — never add one.
4. **Write stories** (`foo.stories.tsx`):
   - CSF3 with `satisfies Meta<typeof Foo>` and `StoryObj<typeof meta>`; title `Components/Foo`.
   - Set default `args` for every prop; use `fn()` from `storybook/test` for callbacks.
   - One story per visual variant/state, plus interaction stories with `play` functions
     asserting behavior (`within`, `userEvent`, `expect` from `storybook/test`).
   - Stories are shared by the web and native Storybooks — keep them platform-neutral and
     import types only from `@storybook/react` (type-only imports are erased at runtime).
5. **Write on-device tests** under `storybook/native/tests/` (e.g. `tests/foo.test.tsx`) with
   [`vitest-mobile`](https://github.com/phantom/vitest-mobile). Tests run **inside a real RN app on a
   booted simulator/emulator** — so they live in the `@template/example` app (the only workspace with
   the New Architecture `vitest-mobile` needs), not colocated in `packages/ui`, because `vitest-mobile`
   discovers them via `require.context(appDir, …)`, which cannot look outside the app. Import
   `@template/ui/foo` and `render`/`cleanup` from `vitest-mobile/runtime`; everything is **async**
   (`await render(...)`, `await locator.tap()`, `await expect.element(...).toHaveText(...)`). Query by
   `testID`/text, drive interaction with `.tap()`/`.type()`, and assert with `toHaveText`/`toContainText`/
   `toBeVisible`. There is no in-process callback spy on-device: observe a prop like `onPress` through a
   **visible state change** (see `tests/button.test.tsx`, which wraps `Button` in a counter). Never assert
   computed styles — Uniwind's `className` is behavior-neutral.
6. **Verify** from the repo root — lint, typecheck, build, and the web Storybook tests must pass:
   ```sh
   bun run lint && bun run typecheck && bun run build && bun run test:storybook
   ```
   Always run this device-free suite yourself. Do **not** run the on-device tests
   (`test:native:ios` / `test:native:android`) locally — CI runs them on every PR
   (see [Testing](#testing)); just make sure the new `tests/foo.test.tsx` exists so CI picks it up.
7. **Add a changeset**: `bun run changeset` → select `@template/ui`, pick `minor` for a new
   component (`patch` for fixes, `major` for breaking changes), write a one-line summary.
   Commit the generated `.changeset/*.md` file with your change.

## Testing

Two independent test layers, by design — with a clear division of responsibility:

- **Story tests (device-free) — always run these yourself.** `bun run test:storybook` runs every
  story in `storybook/web` as a Vitest browser test in Chromium (`@storybook/addon-vitest`). This
  is the fast suite: `bun run test` aliases to it, the husky pre-commit hook runs it, and CI runs
  it on `ubuntu-latest`. It needs `bunx playwright install chromium` once. Story `play` functions
  assert interaction behavior on react-native-web. Run it before every commit/push — it is the
  baseline verification for any change.
- **On-device component tests — leave these to CI.** `bun run test:native:ios` (or
  `test:native:android`) runs the tests under `storybook/native/tests/` with
  [`vitest-mobile`](https://github.com/phantom/vitest-mobile): it boots a simulator/emulator, builds
  and launches the `@template/example` RN app, and streams tests to it over WebSocket, driving
  **real native views and touch events**. This is why the tests live in the app and not in
  `packages/ui` (see the component checklist, step 5). **Do not run these locally by default** —
  they need a native toolchain and a booted simulator/emulator, and CI runs both platforms on
  every PR (see below). Still *write* on-device tests for new components (checklist step 5);
  push and let CI execute them. Run them locally only when explicitly asked to, or when debugging
  a CI failure on a machine that already has the toolchain — the setup below is for those cases.

`vitest-mobile` prerequisites (from its README): Node ≥ 18, RN ≥ 0.81.5 with the **New
Architecture** (the example app has `newArchEnabled: true`), and a platform toolchain — **iOS
needs Xcode ≥ 15** (macOS only); Android needs SDK API 35 + Java 17. Because the on-device engine
loads the app through the project's own `metro.config.js`, Uniwind's `className` resolves exactly
as it does at runtime — no test-only styling shim.

**Two config pieces make this work in this monorepo — don't remove them:**

- `vitest.config.mts` sets **`isolate: false` on each project**. All test files share one booted
  app over a single WebSocket; with the default `isolate: true`, each extra test file spawns a
  fresh worker that tears down the previous app session, so every file after the first silently
  never runs (and the suite still exits `0`). It must be set per-project, not top-level.
- `storybook/native/metro.config.js` has a block guarded by `if (process.env.VITEST_MOBILE_APP_ROOT)`
  (set by vitest-mobile only during test runs, so `expo start`/Storybook are unaffected). It
  reproduces what vitest-mobile's *generated* config would do — pin the Metro server root to the
  app dir, stub Node built-ins that `vitest/worker` imports, watch the built harness project, and
  pin `react`/`react-native`/`@babel/runtime` + `InitializeCore` to the harness tree. Without it
  the harness bundle 404s, fails to resolve `node:*`, or crashes with "setImmediate doesn't exist".
  The file is a CommonJS module — use `__dirname`, never `import.meta.dirname` (which crashes the
  `require()` load under Node's ESM auto-detection).

**Local on-device runs (debugging only — CI is the normal path).** First run on a machine builds
the native harness (~5 min, then cached). Pick the platform your toolchain supports — iOS shown;
swap `ios` → `android` on Linux+KVM:

```sh
bun run --cwd storybook/native test:native:ios:bootstrap   # build + boot + install the harness app
bun run test:native:ios                                    # == vitest run --project ios in storybook/native
```

On a fresh/rebooted machine, `bun run --cwd storybook/native test:native:android:setup`
(`scripts/android-setup.sh`) gets a device ready idempotently: it pre-starts the adb server,
bootstraps only if this project never has, and boots the cached AVD headless and waits for it
(reusing an already-booted emulator). It does **not** run tests — chain it before the suite, e.g.
`test:native:android:run` does `…:setup && …:android` in one step.

**CI:** `.github/workflows/ci.yml` runs these on separate runners — the `checks` job
(lint/typecheck/build/story tests) on `ubuntu-latest`, plus two on-device jobs following the
`vitest-mobile` README recipes: `native-ios` on `macos-latest` and `native-android` on
`ubuntu-latest` (KVM + SDK 35 + Java 17). Both do `bootstrap --headless` → `bundle` →
`vitest run --project <platform>`. GitHub's macOS runners are free for **public** repos; a
**private** project scaffolded from this template that keeps the iOS job will bill macOS minutes
at ~10× — drop it and keep only `native-android` if that matters.

## Styling (Uniwind)

The library styles React Native components with Tailwind classes through
[Uniwind](https://uniwind.dev), the Tailwind provider for React Native. There is no runtime
provider to mount: Uniwind rewrites `react-native` imports to className-aware components in the
**bundler**, so components just import from `react-native` and set `className`. That rewrite is
configured once per app, and the three pieces below are already wired in this repo:

- **Native (Metro)** — `storybook/native/metro.config.js` wraps the config with
  `withUniwindConfig(...)` from `uniwind/metro`, as the **outermost** wrapper. `cssEntryFile`
  must be a plain relative string.
- **Web (Vite)** — `storybook/web/.storybook/main.ts` adds `@tailwindcss/vite` and
  `uniwind({...})` from `uniwind/vite` in `viteFinal`.
- **CSS entry** — each Storybook has a `global.css` (`@import 'tailwindcss'; @import 'uniwind';`)
  imported from its `preview`. Because components live in `packages/ui`, each `global.css` has an
  `@source '../../packages/ui/src'` so Tailwind's scanner finds the class strings there.

`className` typechecks via a per-workspace `uniwind-env.d.ts` (`/// <reference types="uniwind/types" />`),
which augments `react-native` to add `className`/`colorClassName`. Uniwind's generated
`uniwind-types.d.ts` (theme-aware autocomplete) is gitignored. The on-device tests exercise
`className` for real: they run inside the native Storybook app, whose Metro config already wraps
`withUniwindConfig`, so Uniwind's bundler rewrite applies. Tests still assert behavior by
`testID`/text — never computed styles.

## Releasing

CI (`.github/workflows/ci.yml`) runs three jobs on every PR: a `ubuntu-latest` `checks` job
(lint, typecheck, build, Storybook browser tests), plus two on-device `vitest-mobile` jobs —
`native-ios` on `macos-latest` and `native-android` on `ubuntu-latest` (each boots its
simulator/emulator, builds the harness, and runs its `--project`).
Releasing is driven entirely by changesets: on pushes to `main`,
`.github/workflows/release.yml` opens/updates a "Version Packages" PR; merging it runs
`changeset version` (bumping versions and writing changelogs) and the next push runs
`bun run release` (`changeset publish`) to publish to npm. It needs the `NPM_TOKEN` repository
secret. Never edit versions in `package.json` or `CHANGELOG.md` by hand — write a changeset
(`bun run changeset`) instead.

What actually publishes differs by context, and the difference is entirely config-driven (same
workflow both places):

- **This template repo** publishes only the scaffolder (`create-react-native-library-template`).
  `create/` is a Bun workspace member, so changesets versions it natively. The three
  `@template/*` packages are `private` **and** listed in the changesets `ignore` array
  (`.changeset/config.json`), so they are never versioned or published here — they are
  placeholder code. Write changesets against `create-react-native-library-template`.
- **Scaffolded projects** publish their library. The scaffolder strips `create` from the
  root `workspaces`, removes `@template/ui` from the changesets `ignore` array, and drops its
  `private` flag — so the library releases through this very same workflow once you rename the
  `@template/*` packages to your own npm scope (update the same `ignore` array) and set `NPM_TOKEN`.

`.github/workflows/deploy-storybook.yml` builds the web Storybook (`storybook/web`) on every
push to `main` and deploys it to GitHub Pages (repo Settings → Pages → Source: GitHub Actions).

## Gotchas

- The husky `pre-commit` hook (`.husky/pre-commit`) runs `bun run lint`, `bun run typecheck`, and
  `bun run test` (the device-free Storybook browser tests — needs
  `bunx playwright install chromium` once) before every commit. Hooks install via the `prepare`
  script on `bun install`. It deliberately does **not** run the on-device `vitest-mobile` tests —
  those need a booted simulator/emulator and are CI's job (never add them to the hook). To bypass
  the hook, commit `--no-verify`.
- On-device tests (`bun run test:native:ios` / `test:native:android`) are run by CI; run them
  locally only for debugging. They need a native toolchain: **Xcode ≥ 15** for iOS or
  **Android SDK 35 + Java 17 (+ KVM on Linux)** for Android, plus a booted simulator/emulator.
  `vitest-mobile bootstrap` builds the harness app (~5 min first run, then cached under
  `~/.cache/vitest-mobile`). The host app is `storybook/native` (`@template/example`) — the only
  workspace with the New Architecture `vitest-mobile` requires. Tests live in
  `storybook/native/tests/` (not colocated in `packages/ui`) because `vitest-mobile` discovers
  them via `require.context(appDir, …)`, which cannot look above the app directory.
- `storybook/native/.rnstorybook/storybook.requires.ts` is generated (by Metro or
  `bun run --cwd storybook/native storybook-generate`) and gitignored — never edit it.
- Test/story files are excluded from the published package and from the bob build; keep
  runtime code out of them.
- The example app must stay on Expo SDK-pinned dependency versions (`bunx expo install ...`
  from `storybook/native` when adding native modules).

<!-- template-exclude:start (this whole section documents create/, which scaffolded projects don't have) -->
## Scaffolder (`create/`)

`create/` holds `create-react-native-library-template`, the npm package behind
`bun create react-native-library-template`. It is a Bun **workspace member** (so changesets
versions and publishes it) but has zero runtime dependencies.
Its `prepack` script snapshots every tracked file of this repo into `create/template/`,
except `create/` itself, pending changesets, and any lines between `template-exclude:start` /
`template-exclude:end` marker comments (used to keep repo-only workflow steps out of scaffolded
projects). It also rewrites a few files for the scaffold: strips `create` from the root
`workspaces`, removes `@template/ui` from the changesets `ignore` array, and drops `private`
from `packages/ui/package.json` — so the scaffolded library is publishable. `.gitignore` files
are shipped renamed to `gitignore` (npm strips them from tarballs); the CLI reverses this on
scaffold. `postpack` deletes the snapshot.

Versioning and publishing go through changesets like any other package: write a changeset
against `create-react-native-library-template`, merge the Version PR, and the next push to
`main` runs `changeset publish` (which triggers `prepack` to build the snapshot). Manual
fallback: `cd create && npm publish`.
<!-- template-exclude:end -->
