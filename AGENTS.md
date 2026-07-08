# Agent guide

Monorepo for a publishable React Native UI library. Bun workspaces:

| Workspace | Package | Purpose |
| --- | --- | --- |
| `packages/ui` | `@template/ui` | The library. The only published package. |
| `apps/storybook` | `@template/storybook-web` | Web Storybook (react-native-web + Vite) and Storybook tests (Vitest browser mode). |
| `apps/native` | `@template/example` | Expo app running Storybook React Native on device. |

Tooling: **bun** (package manager + script runner), **biome** (lint + format), **TypeScript 6**
(strict, `verbatimModuleSyntax` — use `import type` for types), **vitest** (unit tests via
react-native-web in jsdom; story tests via `@storybook/addon-vitest` in Chromium),
**react-native-builder-bob** (library build), **changesets** (versioning/publishing).

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
   - `Foo.tsx` — the component.
   - `Foo.test.tsx` — vitest unit tests.
   - `Foo.stories.tsx` — Storybook stories (CSF3), including at least one `play` function.
   - `index.ts` — re-exports: `export { Foo, type FooProps } from './Foo';`
2. **Write the component** (`Foo.tsx`):
   - Named function export (`export function Foo(...)`), never a default export.
   - Export a `FooProps` interface with a JSDoc comment per prop; document defaults with `@default`.
   - Only import from `react`, `react-native`, and internal modules. New runtime dependencies
     need explicit approval — they become dependencies for every consumer of the library.
   - Use only RN APIs that exist on react-native-web (`View`, `Text`, `Pressable`,
     `StyleSheet`, ...), otherwise unit tests and the web Storybook will break.
   - Style with `StyleSheet.create` and the design tokens from `src/theme` (`colors`,
     `spacing`, `radii`, `fontSizes`) — no hard-coded colors or magic numbers. Add new tokens
     to `src/theme/tokens.ts` if needed.
   - Accessibility is required: set `accessibilityRole`, `accessibilityState`, and accept an
     `accessibilityLabel` prop. Also accept `style` (as `StyleProp<...>`) and `testID`.
3. **Export it from the library**: add `export * from './components/Foo';` to
   `packages/ui/src/index.ts`.
4. **Write stories** (`Foo.stories.tsx`):
   - CSF3 with `satisfies Meta<typeof Foo>` and `StoryObj<typeof meta>`; title `Components/Foo`.
   - Set default `args` for every prop; use `fn()` from `storybook/test` for callbacks.
   - One story per visual variant/state, plus interaction stories with `play` functions
     asserting behavior (`within`, `userEvent`, `expect` from `storybook/test`).
   - Stories are shared by the web and native Storybooks — keep them platform-neutral and
     import types only from `@storybook/react` (type-only imports are erased at runtime).
5. **Write unit tests** (`Foo.test.tsx`) with `@testing-library/react`. They run in jsdom with
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
every PR. On pushes to `main`, `.github/workflows/release.yml` uses changesets to open/update
a "Version Packages" PR; merging it publishes `@template/ui` to npm (requires the `NPM_TOKEN`
repository secret). Never edit versions in `package.json` or `CHANGELOG.md` by hand.

## Gotchas

- `apps/native/.rnstorybook/storybook.requires.ts` is generated (by Metro or
  `bun run --cwd apps/native storybook-generate`) and gitignored — never edit it.
- Test/story files are excluded from the published package and from the bob build; keep
  runtime code out of them.
- The example app must stay on Expo SDK-pinned dependency versions (`bunx expo install ...`
  from `apps/native` when adding native modules).
