---
"create-react-native-library-template": patch
---

Rebalance who runs which test layer: agents/contributors should always run the device-free
Storybook browser tests (`bun run test`) themselves, but leave the on-device `vitest-mobile`
suites (`test:native:ios` / `test:native:android`) to CI rather than running them locally by
default — they need a native toolchain and a booted simulator/emulator. `AGENTS.md` is updated
throughout to reflect this division of responsibility, and the husky `pre-commit` hook now also
runs `bun run test` (in addition to lint and typecheck), while still deliberately excluding the
on-device tests.
