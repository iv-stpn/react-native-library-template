---
"@template/ui": patch
---

Mark `@template/ui` as `private` so the release workflow no longer tries to publish the placeholder `@template` scope to npm (which 404s). Changesets still versions it and writes its changelog; the template only publishes the `create/` scaffolder. Scaffolded projects that want to publish their library should rename the `@template/*` packages to their own npm scope, remove `"private": true` from `packages/ui/package.json`, and set the `NPM_TOKEN` repository secret.
