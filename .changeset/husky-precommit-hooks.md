---
"@template/ui": patch
---

Add a husky `pre-commit` hook that runs lint, typecheck, and unit tests before every commit. Hooks install via a `prepare` script on `bun install`, and the setup is included in scaffolded projects (`bun create react-native-library-template`). The scaffolder's "Next steps" now runs `git init` before `bun install` so the hooks install on the first install. No runtime changes to the published package.
