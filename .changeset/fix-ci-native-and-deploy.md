---
"create-react-native-library-template": patch
---

Fix the three CI failures the template shipped with:

- **Native jobs (iOS + Android): build the library first.** Metro resolves `@template/ui/*` through the package's `default` export condition (`lib/module/...`), so without `bun run build` the `vitest-mobile bundle` step died with `FailedToResolveNameError: @template/ui/button`. Both native jobs now build `packages/ui` before bootstrapping. (Locally this never surfaced because `lib/` already existed from earlier builds.)
- **Deploy Storybook: declare `react-native-web` in `packages/ui` devDependencies.** Storybook's react-docgen importer swaps a resolved `react-native/index.js` for a *sibling* `react-native-web/dist/index.js` — but only if that sibling exists. With bun's isolated linker, `packages/ui/node_modules/` only contains declared deps, so on a fresh CI install the swap failed and react-docgen crashed parsing react-native's Flow syntax (`} as ReactNativePublicAPI;` → "Missing semicolon"). Declaring `react-native-web` makes the sibling exist deterministically.
- **iOS bootstrap: surface the real pod-install error.** The RN CLI swallows CocoaPods failures unless run with `--verbose`, which `vitest-mobile` can't pass through. The iOS job now has an `if: failure()` step that dumps the vitest-mobile logs and re-runs `pod install --verbose` in the harness project.
