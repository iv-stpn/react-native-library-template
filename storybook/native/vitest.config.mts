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
export default defineConfig({
  test: {
    // One project per platform. Each `--project` runs on its own device, so the
    // two never run at once (a run needs that platform's simulator/emulator
    // booted): CI runs `--project ios` on macOS and `--project android` on
    // Linux+KVM. Locally, run one at a time via the `test:native:*` scripts.
    projects: [
      {
        plugins: [nativePlugin({ platform: 'ios' })],
        test: {
          name: 'ios',
          include: ['tests/**/*.test.tsx'],
        },
      },
      {
        plugins: [nativePlugin({ platform: 'android' })],
        test: {
          name: 'android',
          include: ['tests/**/*.test.tsx'],
        },
      },
    ],
  },
});
