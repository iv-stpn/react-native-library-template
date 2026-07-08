# react-native-library-template

Template for building and publishing a React Native UI component library.

- **[Bun](https://bun.sh)** — package manager, script runner, workspaces
- **[TypeScript 6](https://www.typescriptlang.org)** — strict mode everywhere
- **[Biome](https://biomejs.dev)** — linting + formatting
- **[Vitest](https://vitest.dev)** — unit tests (react-native-web in jsdom)
- **[Storybook 10](https://storybook.js.org)** — web (react-native-web + Vite) **and** on-device (Expo) demos from the same stories
- **Storybook tests** — every story runs as a Vitest browser-mode test; `play` functions assert interactions
- **[Changesets](https://github.com/changesets/changesets)** — versioning, changelogs, npm publishing via GitHub Actions
- **[react-native-builder-bob](https://github.com/callstack/react-native-builder-bob)** — ESM + type declarations build

## Layout

```
packages/ui/        @template/ui — the library (published)
apps/storybook/     Web Storybook + Storybook tests
apps/native/        Expo app running Storybook React Native on device
```

## Getting started

```sh
bun install

bun run storybook            # web Storybook → http://localhost:6006
bun run storybook:native     # Expo dev server (press i / a, or scan QR)

bun run lint                 # biome
bun run typecheck            # tsc in every workspace
bun run test:unit            # vitest unit tests
bunx playwright install chromium   # once, for storybook tests
bun run test:storybook       # every story as a browser test
bun run build                # library build → packages/ui/lib
```

## Adding components

See [AGENTS.md](./AGENTS.md) — it documents the full checklist (component, tests, stories,
exports, changeset). `packages/ui/src/components/Button` is the reference implementation.

## Releasing

1. With every user-facing change, run `bun run changeset` and commit the generated file.
2. On merge to `main`, the release workflow opens/updates a **Version Packages** PR.
3. Merge that PR → `@template/ui` is built and published to npm.

Requires an `NPM_TOKEN` repository secret (npm automation token) and workflow permission to
create pull requests (repo Settings → Actions → General → "Allow GitHub Actions to create and
approve pull requests").

## Using this template

1. Rename `@template/ui` in `packages/ui/package.json` (plus its uses in the two app
   `package.json`s, `.changeset/config.json`, root scripts, and AGENTS.md) to your package name.
2. Update `repository`, `license`, and `description` in `packages/ui/package.json`.
3. Push to GitHub, add the `NPM_TOKEN` secret, and start building components.
