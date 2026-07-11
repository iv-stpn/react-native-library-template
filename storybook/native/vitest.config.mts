import { defineConfig } from 'vitest/config';
import { nativePlugin } from 'vitest-mobile';

// vitest-mobile runs each test *inside a real React Native app on a booted
// simulator/emulator* (real Fabric views, real native taps over a WebSocket),
// not in Node/jsdom. This app (`@template/example`) is the host: it has New
// Architecture enabled (app.json `newArchEnabled`), RN 0.81.5, and the Uniwind
// Metro config — so components render with their real `className` styling.
//
// Because the on-device runner discovers tests via `require.context(appDir, …)`,
// the test files MUST live under this workspace (see `tests/`). `appDir`
// resolves to `process.cwd()`, so these tests must be run from `storybook/native`
// (the `test:native:*` scripts do this). Running requires a native build + a
// booted device — see the CI `native-ios` / `native-android` jobs and AGENTS.md;
// it cannot run in the pre-commit hook or on a plain Linux runner.
//
// `isolate: false` is REQUIRED for a multi-file suite, and must be set on EACH
// project (vitest-mobile reads `project.config.isolate`; a top-level `test.isolate`
// does not propagate into projects). All test files share one booted app over a
// single WebSocket, so they run in one persistent worker/session. vitest-mobile
// only defaults isolate→false when it's `undefined`; something in this project's
// resolved config sets it, so with the default `isolate: true` each extra test
// file spins up a fresh worker that tears down the previous app session — the
// later files then silently never run (and the suite still exits 0). With
// `isolate: false` every file runs in the same session, so the whole suite runs.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [nativePlugin({ platform: 'ios' })],
        test: {
          name: 'ios',
          include: ['tests/**/*.test.tsx'],
          isolate: false,
        },
      },
      {
        plugins: [nativePlugin({ platform: 'android' })],
        test: {
          name: 'android',
          include: ['tests/**/*.test.tsx'],
          isolate: false,
        },
      },
    ],
  },
});
