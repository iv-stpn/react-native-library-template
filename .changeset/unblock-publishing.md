---
"@template/ui": patch
---

Remove the `private` flag from `@template/ui` so the release workflow publishes it to npm (the flag was preventing `changeset publish` from touching it). The scaffolder no longer strips it — scaffolded projects get a publishable library by default, which publishes once the scope is renamed and `NPM_TOKEN` is set.