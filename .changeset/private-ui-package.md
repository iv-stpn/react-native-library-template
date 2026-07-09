---
"@template/ui": patch
---

Mark `@template/ui` as `private` so the release workflow no longer tries to publish the placeholder `@template` scope to npm (which 404s). Changesets still versions it and writes its changelog; the template only publishes the `create/` scaffolder. Scaffolded projects publish their library normally — the scaffolder strips this `private` flag — once the `@template/*` packages are renamed to your own npm scope and the `NPM_TOKEN` repository secret is set.
