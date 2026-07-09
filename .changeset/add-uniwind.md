---
"create-react-native-library-template": minor
---

Adopt [Uniwind](https://uniwind.dev) as the Tailwind styling provider for React Native. Scaffolded projects now style components with Tailwind `className` (resolved by Uniwind at bundle time) and compose variants with `class-variance-authority`, replacing the previous `StyleSheet` + design-token approach. The `Button` reference component is rewritten to use `className`/`cva`, and the `@template/ui` `./theme` token export is removed. Wiring is added to every workspace: the Vite web Storybook (`@tailwindcss/vite` + `uniwind/vite`), the Expo/Metro native Storybook (`withUniwindConfig`), a `global.css` entry per app, and the `uniwind/types` augmentation that adds `className` to React Native components. The `Button` also gets accessible, web-scoped focus handling: the always-on UA outline that react-native-web's focusable `div` shows on pointer focus is suppressed, and a keyboard-only `focus-visible` ring is restored.
