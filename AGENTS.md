# Agent guide

Monorepo for a publishable React Native UI library. Bun workspaces:

| Workspace | Package | Purpose |
| --- | --- | --- |
| `packages/ui` | `@template/ui` | The library. Versioned by changesets but `private` (see [Releasing](#releasing)). |
| `storybook/web` | `@template/storybook-web` | Web Storybook (react-native-web + Vite) and Storybook tests (Vitest browser mode). |
| `storybook/native` | `@template/example` | Expo app running Storybook React Native on device. |

Tooling: **bun** (package manager + script runner), **biome** (lint + format), **TypeScript 6**
(strict, `verbatimModuleSyntax` — use `import type` for types), **vitest** (unit tests via
react-native-web in jsdom; story tests via `@storybook/addon-vitest` in Chromium),
**react-native-builder-bob** (library build), **changesets** (versioning/publishing),
**husky** (git hooks — a `pre-commit` hook runs lint, typecheck, and unit tests).

## Commands (run from the repo root)

| Command | What it does |
| --- | --- |
| `bun install` | Install all workspaces. |
| `bun run lint` / `bun run lint:fix` | Biome check / autofix. |
| `bun run typecheck` | `tsc --noEmit` in every workspace. |
| `bun run test:unit` | Vitest unit tests in `packages/ui`. |
| `bun run test:storybook` | Runs every story as a Vitest browser test (needs `bunx playwright install chromium` once). |
| `bun run test` | Both of the above. |
| `bun run build` | Builds the library with bob into `packages/ui/lib`. |
| `bun run storybook` | Web Storybook at http://localhost:6006. |
| `bun run storybook:native` | Expo dev server for the on-device Storybook. |
| `bun run changeset` | Record a changeset for release notes/versioning. |

## Creating a new component

Follow the `Button` component (`packages/ui/src/components/Button/`) as the reference
implementation. For a component named `Foo`:

1. **Create the folder** `packages/ui/src/components/Foo/` containing exactly:
   - `foo.tsx` — the component.
   - `foo.test.tsx` — vitest unit tests.
   - `foo.stories.tsx` — Storybook stories (CSF3), including at least one `play` function.

   **No `index.ts`** — barrel files are forbidden everywhere in the library. Public entry
   points are declared in the `exports` map of `packages/ui/package.json` (step 3), and
   internal imports always target the concrete file (`../../theme/tokens`), never a folder.
2. **Write the component** (`foo.tsx`):
   - Named function export (`export function Foo(...)`), never a default export.
   - Export a `FooProps` interface with a JSDoc comment per prop; document defaults with `@default`.
   - Only import from `react`, `react-native`, and internal modules. New runtime dependencies
     need explicit approval — they become dependencies for every consumer of the library.
   - Use only RN APIs that exist on react-native-web (`View`, `Text`, `Pressable`,
     `StyleSheet`, ...), otherwise unit tests and the web Storybook will break.
   - Style with `StyleSheet.create` and the design tokens from `src/theme/tokens.ts` (`colors`,
     `spacing`, `radii`, `fontSizes`) — no hard-coded colors or magic numbers. Add new tokens
     to `src/theme/tokens.ts` if needed.
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
5. **Write unit tests** (`foo.test.tsx`) with `@testing-library/react`. They run in jsdom with
   `react-native` aliased to `react-native-web`. Query by accessible role/name
   (`screen.getByRole('button', { name: ... })`), and cover: rendering, interaction callbacks,
   and disabled/edge states.
6. **Verify** from the repo root — all must pass:
   ```sh
   bun run lint && bun run typecheck && bun run test:unit && bun run build && bun run test:storybook
   ```
7. **Add a changeset**: `bun run changeset` → select `@template/ui`, pick `minor` for a new
   component (`patch` for fixes, `major` for breaking changes), write a one-line summary.
   Commit the generated `.changeset/*.md` file with your change.

## Releasing

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build, and Storybook tests on
every PR. Releasing is driven entirely by changesets: on pushes to `main`,
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

- The husky `pre-commit` hook (`.husky/pre-commit`) runs `bun run lint`, `bun run typecheck`,
  and `bun run test:unit` before every commit. Hooks install via the `prepare` script on
  `bun install`. It does not run the Storybook browser tests (they need Chromium) — run
  `bun run test:storybook` yourself before pushing, since CI does. To bypass the hook in a
  pinch, commit with `--no-verify`.
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
