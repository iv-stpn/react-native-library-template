# @template/ui

## 0.1.2

### Patch Changes

- 6c594db: Add a husky `pre-commit` hook that runs lint, typecheck, and unit tests before every commit. Hooks install via a `prepare` script on `bun install`, and the setup is included in scaffolded projects (`bun create react-native-library-template`). The scaffolder's "Next steps" now runs `git init` before `bun install` so the hooks install on the first install. No runtime changes to the published package.

## 0.1.1

### Patch Changes

- f77680d: Repo housekeeping: Storybook workspaces moved from `apps/` to `storybook/` (`storybook/web`, `storybook/native`), the web Storybook demo now deploys to GitHub Pages from `main`, and the contributor guide documents the exports-map convention (per-subpath `exports` in `package.json`, no barrel files). No runtime changes to the published package.
- 98fd966: Remove `.tsx` extensions from relative imports in test and story files — they made `tsc --noEmit` fail with TS5097 since `allowImportingTsExtensions` is not enabled.
