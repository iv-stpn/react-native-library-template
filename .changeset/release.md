---
"create-react-native-library-template": patch
---

Release the scaffolder through changesets. `create/` is now a Bun workspace member, so `changeset version` bumps `create-react-native-library-template` and writes its changelog, and `changeset publish` publishes it on merge of the Version Packages PR. The template packages (`@template/ui` and the two Storybook apps) are `private` and in the changesets `ignore` list, so they are never versioned or published from this repo. Scaffolded projects strip `create` from the workspaces, drop `@template/ui` from the ignore list, and remove its `private` flag, so their library releases through the very same workflow.
