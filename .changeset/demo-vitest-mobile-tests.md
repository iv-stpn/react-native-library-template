---
"create-react-native-library-template": patch
---

Make the `vitest-mobile` on-device suite actually run in this monorepo.

Fixes that were needed for on-device tests to run at all against the app's own Metro config (Uniwind + Storybook) in a Bun monorepo:

- **`metro.config.js`**: `import.meta.dirname` (ESM-only) crashed the CommonJS config load under Node's ESM auto-detection — replaced with `__dirname`. Under `VITEST_MOBILE_APP_ROOT` (test runs only, so `expo start`/Storybook are untouched) the config now also reproduces what vitest-mobile's generated config would do: pin `server.unstable_serverRoot` to the app dir (else the harness entry 404s), stub Node built-ins / Vitest internals (`node:vm`, jsdom, …) that `vitest/worker` imports, add the built harness project to `watchFolders`, pin `react`/`react-native`/`@react-native/*`/`@babel/runtime` to the harness tree, and harness-anchor `getModulesRunBeforeMainModule` + the asset registry (else a split-brain second react-native crashes with "Property 'setImmediate' doesn't exist").
- **`vitest.config.mts`**: set `isolate: false` on each project — required for a multi-file suite. All test files share one booted app over a single WebSocket; with the default `isolate: true` each extra file spawns a fresh worker that tears down the previous session, so later files silently never run (and the suite still exits 0).
- **`storybook/native/scripts/android-setup.sh`**: a resumable helper that makes sure a device is ready before testing — pre-starts the adb server (works around a WSL fork-hang), bootstraps the harness only if this project never has, boots the cached AVD headless and waits for `sys.boot_completed`, then runs the suite (reusing an already-booted emulator).

Like the rest of the suite, `tests/button.test.tsx` runs only on a booted simulator/emulator (`bun run test:native:android` / `test:native:ios`), never in the pre-commit hook.
