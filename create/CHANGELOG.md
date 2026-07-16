# create-react-native-library-template

## 0.3.1

### Patch Changes

- cc88372: Upgrade Expo to v57 and related dependencies. Note: Expo Go is no longer supported — the example app (native Storybook) requires a [development build](https://docs.expo.dev/develop/development-builds/introduction/) as of Expo SDK 55+.
- 1562f27: Fix `vitest-mobile bundle` crash ("Unexpected module with full source map") on Android CI with RN 0.86+. The harness's npm-installed `metro-runtime` ships `require.js` pre-compiled with an embedded sourceMappingURL; Babel emits a composed source-map object that `metro-source-map@0.84.4` cannot handle. The native Metro config now normalises full source-map objects to empty arrays before serialisation (scoped to vitest-mobile test runs only).
- 3122e05: Pin devDependency versions, update biome plugins to latest, bump TypeScript to v7, and clean up redundant biome-ignore comments in metro config.

## 0.3.0

### Minor Changes

- 7b30021: Adopt [`vitest-mobile`](https://github.com/phantom/vitest-mobile) for on-device component tests. Tests now run inside a real React Native app on a booted simulator/emulator — real native views and real touch events — via the `@template/example` native Storybook app (the only workspace with the New Architecture that `vitest-mobile` requires). Because `vitest-mobile` discovers tests with `require.context(appDir, …)` (which cannot traverse upward), test files live under `storybook/native/tests/` rather than colocated in `packages/ui`; the `Button` test moves there and is rewritten to `vitest-mobile/runtime`'s API (`await render`, locator `.tap()`, `await expect.element(...).toHaveText(...)`), observing `onPress` through a visible state change since there is no in-process spy on-device. `vitest-mobile` + `vitest` are added to `@template/example`, with per-platform `test:native:ios`/`test:native:android` scripts (plus `:bootstrap`/`:bundle` variants). The old jsdom + `react-native-web` unit-test setup in `packages/ui` (and its `@testing-library/react`, `jest-dom`, `jsdom`, `react-dom`, `react-native-web`, `vitest` deps) is removed. Following the `vitest-mobile` docs, CI gains two on-device jobs — `native-ios` on `macos-latest` and `native-android` on `ubuntu-latest` (KVM) — each running `bootstrap --headless` → `bundle` → `vitest run --project <platform>`. The pre-commit hook and default `bun run test` no longer run unit tests (device-bound); `bun run test:native:ios` / `test:native:android` are the explicit on-device suites. The web Storybook is unaffected.

### Patch Changes

- 9a818c2: Rebalance who runs which test layer: agents/contributors should always run the device-free
  Storybook browser tests (`bun run test`) themselves, but leave the on-device `vitest-mobile`
  suites (`test:native:ios` / `test:native:android`) to CI rather than running them locally by
  default — they need a native toolchain and a booted simulator/emulator. `AGENTS.md` is updated
  throughout to reflect this division of responsibility, and the husky `pre-commit` hook now also
  runs `bun run test` (in addition to lint and typecheck), while still deliberately excluding the
  on-device tests.
- e68103a: Make the `vitest-mobile` on-device suite actually run in this monorepo.

  Fixes that were needed for on-device tests to run at all against the app's own Metro config (Uniwind + Storybook) in a Bun monorepo:

  - **`metro.config.js`**: `import.meta.dirname` (ESM-only) crashed the CommonJS config load under Node's ESM auto-detection — replaced with `__dirname`. Under `VITEST_MOBILE_APP_ROOT` (test runs only, so `expo start`/Storybook are untouched) the config now also reproduces what vitest-mobile's generated config would do: pin `server.unstable_serverRoot` to the app dir (else the harness entry 404s), stub Node built-ins / Vitest internals (`node:vm`, jsdom, …) that `vitest/worker` imports, add the built harness project to `watchFolders`, pin `react`/`react-native`/`@react-native/*`/`@babel/runtime` to the harness tree, and harness-anchor `getModulesRunBeforeMainModule` + the asset registry (else a split-brain second react-native crashes with "Property 'setImmediate' doesn't exist").
  - **`vitest.config.mts`**: set `isolate: false` on each project — required for a multi-file suite. All test files share one booted app over a single WebSocket; with the default `isolate: true` each extra file spawns a fresh worker that tears down the previous session, so later files silently never run (and the suite still exits 0).
  - **`storybook/native/scripts/android-setup.sh`**: a resumable helper that makes sure a device is ready before testing — pre-starts the adb server (works around a WSL fork-hang), bootstraps the harness only if this project never has, boots the cached AVD headless and waits for `sys.boot_completed`, then runs the suite (reusing an already-booted emulator).

  Like the rest of the suite, `tests/button.test.tsx` runs only on a booted simulator/emulator (`bun run test:native:android` / `test:native:ios`), never in the pre-commit hook.

- 1e3c74e: Fix the three CI failures the template shipped with:

  - **Native jobs (iOS + Android): build the library first.** Metro resolves `@template/ui/*` through the package's `default` export condition (`lib/module/...`), so without `bun run build` the `vitest-mobile bundle` step died with `FailedToResolveNameError: @template/ui/button`. Both native jobs now build `packages/ui` before bootstrapping. (Locally this never surfaced because `lib/` already existed from earlier builds.)
  - **Deploy Storybook: declare `react-native-web` in `packages/ui` devDependencies.** Storybook's react-docgen importer swaps a resolved `react-native/index.js` for a _sibling_ `react-native-web/dist/index.js` — but only if that sibling exists. With bun's isolated linker, `packages/ui/node_modules/` only contains declared deps, so on a fresh CI install the swap failed and react-docgen crashed parsing react-native's Flow syntax (`} as ReactNativePublicAPI;` → "Missing semicolon"). Declaring `react-native-web` makes the sibling exist deterministically.
  - **`tests/button.test.tsx`: drop the iOS-incompatible label-absence assertion.** vitest-mobile's iOS text queries also match `accessibilityLabel` — which `Button` intentionally keeps set to the label while loading — so `queryByText('Increment')` still resolved on iOS (Android only reads visible TextView text). The loading behavior is still covered by the spinner-visible and tap-is-a-no-op assertions.
  - **Native jobs: cache the built harness.** Both jobs now restore/save `~/.cache/vitest-mobile` (plus the API-35 system image on Android) keyed by `vitest-mobile cache-key`, per the vitest-mobile docs' CI recipe — a cache hit skips the ~5-min native build; the `restore-keys` prefix lets bootstrap resume from a stale build after a dependency bump.
  - **iOS bootstrap: pin Ruby 3.3.** On `macos-latest` the default (Homebrew) Ruby is 3.4, where `kconv` — required by CocoaPods' CFPropertyList to read the Hermes XCFramework's binary plists — became a bundled gem, unloadable under `bundle exec` unless the Gemfile declares it. The harness Gemfile is generated by vitest-mobile, so the job pins Ruby 3.3 (kconv still a default gem) via `ruby/setup-ruby`. The RN CLI swallows this error unless run with `--verbose` (which vitest-mobile can't pass through), so the job also keeps an `if: failure()` step that dumps the vitest-mobile logs and re-runs `pod install --verbose` in the harness project.

- 1e8673f: Fix the release workflow failing on the automated "chore: version packages" commit. The
  changesets action git-commits the version bump on `ubuntu-latest`, which fired the husky
  `pre-commit` hook and its Playwright/Vitest browser story tests — but that runner never
  installs Chromium (only the CI `checks` job does), so the hook crashed and took the release
  with it. The `release` job now sets `HUSKY=0` to skip hooks for its automated commits; the
  `checks` job still runs lint/typecheck/build/story tests on every push and PR.

## 0.2.0

### Minor Changes

- 8094016: Adopt [Uniwind](https://uniwind.dev) as the Tailwind styling provider for React Native. Scaffolded projects now style components with Tailwind `className` (resolved by Uniwind at bundle time) and compose variants with `class-variance-authority`, replacing the previous `StyleSheet` + design-token approach. The `Button` reference component is rewritten to use `className`/`cva`, and the `@template/ui` `./theme` token export is removed. Wiring is added to every workspace: the Vite web Storybook (`@tailwindcss/vite` + `uniwind/vite`), the Expo/Metro native Storybook (`withUniwindConfig`), a `global.css` entry per app, and the `uniwind/types` augmentation that adds `className` to React Native components. The `Button` also gets accessible, web-scoped focus handling: the always-on UA outline that react-native-web's focusable `div` shows on pointer focus is suppressed, and a keyboard-only `focus-visible` ring is restored.

## 0.1.5

### Patch Changes

- 07466ad: Release the scaffolder through changesets. `create/` is now a Bun workspace member, so `changeset version` bumps `create-react-native-library-template` and writes its changelog, and `changeset publish` publishes it on merge of the Version Packages PR. The template packages (`@template/ui` and the two Storybook apps) are `private` and in the changesets `ignore` list, so they are never versioned or published from this repo. Scaffolded projects strip `create` from the workspaces, drop `@template/ui` from the ignore list, and remove its `private` flag, so their library releases through the very same workflow.
