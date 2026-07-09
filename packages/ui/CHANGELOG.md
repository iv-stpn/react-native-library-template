# @template/ui

## 0.1.4

### Patch Changes

- 2618470: Mark `@template/ui` as `private` so the release workflow no longer tries to publish the placeholder `@template` scope to npm (which 404s). Changesets still versions it and writes its changelog; the template only publishes the `create/` scaffolder. Scaffolded projects publish their library normally once the `@template/*` packages are renamed to your own npm scope and the `NPM_TOKEN` repository secret is set.
- 4424a60: Remove the `private` flag from `@template/ui` so the release workflow publishes it to npm (the flag was preventing `changeset publish` from touching it). The scaffolder no longer strips it — scaffolded projects get a publishable library by default, which publishes once the scope is renamed and `NPM_TOKEN` is set.

## 0.1.3

### Patch Changes

- a6ba45e: Mark `@template/ui` as `private` so the release workflow no longer tries to publish the placeholder `@template` scope to npm (which 404s). Changesets still versions it and writes its changelog; the template only publishes the `create/` scaffolder. Scaffolded projects that want to publish their library should rename the `@template/*` packages to their own npm scope, remove `"private": true` from `packages/ui/package.json`, and set the `NPM_TOKEN` repository secret.
- f8a35ba: Add live-demo and npm badges plus a hosted-Storybook/scaffolder description to the repo `README.md`, and wrap those repo-only sections in `template-exclude` markers so scaffolded projects get a clean README without the template's own demo links and package badges. No runtime changes to the published package.

## 0.1.2

### Patch Changes

- 6c594db: Add a husky `pre-commit` hook that runs lint, typecheck, and unit tests before every commit. Hooks install via a `prepare` script on `bun install`, and the setup is included in scaffolded projects (`bun create react-native-library-template`). The scaffolder's "Next steps" now runs `git init` before `bun install` so the hooks install on the first install. No runtime changes to the published package.

## 0.1.1

### Patch Changes

- f77680d: Repo housekeeping: Storybook workspaces moved from `apps/` to `storybook/` (`storybook/web`, `storybook/native`), the web Storybook demo now deploys to GitHub Pages from `main`, and the contributor guide documents the exports-map convention (per-subpath `exports` in `package.json`, no barrel files). No runtime changes to the published package.
- 98fd966: Remove `.tsx` extensions from relative imports in test and story files — they made `tsc --noEmit` fail with TS5097 since `allowImportingTsExtensions` is not enabled.
