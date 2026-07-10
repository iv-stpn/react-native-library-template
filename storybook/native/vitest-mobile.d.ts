// Ambient shim for `vitest-mobile`'s main (node) entry.
//
// vitest-mobile@0.4.3 maps its `.` export's `types` to `dist/node/index.d.ts`,
// which it does not actually ship (there are no `.d.ts` files in its `dist/`).
// Under this repo's `moduleResolution: bundler` — which honors package `exports`
// — TypeScript can't find a declaration for `import { nativePlugin } from
// 'vitest-mobile'` and reports TS7016 (implicit any). The package's root-level
// `types: matchers.d.ts` only applies when NOT respecting `exports`, so it never
// kicks in here. Until the package ships real types, declare the sliver we use.
//
// This is intentionally a *script* file (no top-level import/export) so the block
// below is an ambient module declaration that fills the missing types, not a
// module augmentation (which would require the module's types to already resolve).
// The return type is written as an `import(...)` type expression for the same
// reason — it keeps the file a script. Subpath imports like `vitest-mobile/runtime`
// are unaffected and still resolve to their shipped source (only used under
// `tests/`, which the typecheck excludes).
declare module 'vitest-mobile' {
  /** Options for the vitest-mobile Vite plugin. `platform` selects the device target. */
  export type NativePluginOptions = { platform?: 'ios' | 'android' } & Record<string, unknown>;

  /**
   * Vite/Vitest plugin that runs each test inside a real React Native app on a
   * booted simulator/emulator. Returns a Vite `Plugin` (re-exported by `vitest/config`).
   */
  export function nativePlugin(options?: NativePluginOptions): import('vitest/config').Plugin;
}
