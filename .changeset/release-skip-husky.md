---
"create-react-native-library-template": patch
---

Fix the release workflow failing on the automated "chore: version packages" commit. The
changesets action git-commits the version bump on `ubuntu-latest`, which fired the husky
`pre-commit` hook and its Playwright/Vitest browser story tests — but that runner never
installs Chromium (only the CI `checks` job does), so the hook crashed and took the release
with it. The `release` job now sets `HUSKY=0` to skip hooks for its automated commits; the
`checks` job still runs lint/typecheck/build/story tests on every push and PR.
