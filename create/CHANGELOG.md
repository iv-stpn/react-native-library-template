# create-react-native-library-template

## 0.2.0

### Minor Changes

- 8094016: Adopt [Uniwind](https://uniwind.dev) as the Tailwind styling provider for React Native. Scaffolded projects now style components with Tailwind `className` (resolved by Uniwind at bundle time) and compose variants with `class-variance-authority`, replacing the previous `StyleSheet` + design-token approach. The `Button` reference component is rewritten to use `className`/`cva`, and the `@template/ui` `./theme` token export is removed. Wiring is added to every workspace: the Vite web Storybook (`@tailwindcss/vite` + `uniwind/vite`), the Expo/Metro native Storybook (`withUniwindConfig`), a `global.css` entry per app, and the `uniwind/types` augmentation that adds `className` to React Native components. The `Button` also gets accessible, web-scoped focus handling: the always-on UA outline that react-native-web's focusable `div` shows on pointer focus is suppressed, and a keyboard-only `focus-visible` ring is restored.

## 0.1.5

### Patch Changes

- 07466ad: Release the scaffolder through changesets. `create/` is now a Bun workspace member, so `changeset version` bumps `create-react-native-library-template` and writes its changelog, and `changeset publish` publishes it on merge of the Version Packages PR. The template packages (`@template/ui` and the two Storybook apps) are `private` and in the changesets `ignore` list, so they are never versioned or published from this repo. Scaffolded projects strip `create` from the workspaces, drop `@template/ui` from the ignore list, and remove its `private` flag, so their library releases through the very same workflow.
