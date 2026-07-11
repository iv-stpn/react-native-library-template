/** biome-ignore-all lint/style/noCommonJs: exception for metro config */
const path = require('node:path');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

// biome-ignore lint/correctness/noGlobalDirnameFilename: this is a CommonJS module (require + module.exports) loaded via require() by both Expo/Metro and vitest-mobile — import.meta.dirname is undefined here and crashes the load, so __dirname is correct. Do not let lint:fix "correct" this.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the whole workspace and resolve hoisted dependencies.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')];

// Uniwind rewrites `react-native` imports to className-aware components at bundle
// time. It must be the outermost Metro wrapper. `cssEntryFile` must stay a plain
// relative string (not path.resolve). The generated dtsFile is gitignored.
const finalConfig = withUniwindConfig(
  withStorybook(config, {
    enabled: true,
    configPath: path.resolve(projectRoot, '.rnstorybook'),
  }),
  {
    cssEntryFile: './global.css',
    dtsFile: './uniwind-types.d.ts',
  },
);

// ── vitest-mobile compatibility (on-device tests only) ──────────────────────
// vitest-mobile normally *generates* the Metro config for the harness. Because
// this app ships its own config (Uniwind + Storybook), vitest-mobile loads ours
// and layers only a thin transform on top — so two things its generated config
// would otherwise set up are missing and must be reproduced here. Both are scoped
// to test runs via VITEST_MOBILE_APP_ROOT (set by vitest-mobile before it loads
// this file), leaving `expo start` / Storybook completely untouched.
// biome-ignore lint/style/noProcessEnv: VITEST_MOBILE_APP_ROOT is the only signal vitest-mobile exposes to detect a test run
// biome-ignore lint/correctness/noProcessGlobal: metro configs run in Node; process is available and expected here
if (process.env.VITEST_MOBILE_APP_ROOT) {
  const fs = require('node:fs');
  const projectRequire = require('node:module').createRequire(path.join(projectRoot, 'package.json'));

  // Locate the harness project vitest-mobile scaffolds and builds under its cache
  // (`<cacheDir>/builds/<hash>/project`). It holds the RN/Metro toolchain the harness
  // bundle is built against (react-native, metro-runtime, @babel/runtime, …). Pick the
  // newest fully-customized one.
  // biome-ignore lint/style/noProcessEnv: mirrors vitest-mobile's own cache-dir resolution
  // biome-ignore lint/correctness/noProcessGlobal: metro configs run in Node; process is available and expected here
  const cacheDir =
    process.env.VITEST_MOBILE_CACHE_DIR ||
    process.env.VITEST_NATIVE_CACHE_DIR ||
    path.join(require('node:os').homedir(), '.cache', 'vitest-mobile');
  const buildsDir = path.join(cacheDir, 'builds');
  const harnessDir = fs
    .readdirSync(buildsDir)
    .map((hash) => path.join(buildsDir, hash, 'project'))
    .filter((dir) => fs.existsSync(path.join(dir, '.vitest-mobile-customized')))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  if (!harnessDir)
    throw new Error(
      `vitest-mobile: no built harness project found under ${buildsDir} — run \`vitest-mobile bootstrap --platform android\` first.`,
    );

  // 1. Server root. Expo's getDefaultConfig sets `server.unstable_serverRoot` to the
  //    *workspace* root in a monorepo (correct for `expo start`). vitest-mobile serves
  //    its generated entry (`.vitest-mobile/index`) by rewriting the bundle URL relative
  //    to the *app* dir, then Metro resolves it against serverRoot — so a workspace-root
  //    serverRoot makes it look for `<repo>/.vitest-mobile/index` and 404. Pin it to the app.
  // biome-ignore lint/style/useNamingConvention: unstable_serverRoot is Metro's own config key, not ours to rename
  finalConfig.server = { ...finalConfig.server, unstable_serverRoot: projectRoot };

  // 2. Watch the harness project. The harness bundle depends on the RN/Metro toolchain
  //    installed there (e.g. `metro-runtime/src/polyfills/require.js`, `@babel/runtime`
  //    helpers the transform injects). Metro only "sees" files inside projectRoot +
  //    watchFolders, so without this they fail with "Failed to get the SHA-1 for …".
  finalConfig.watchFolders = [...(finalConfig.watchFolders ?? []), harnessDir];

  // 2b. Harness-anchor the pre-main modules + asset registry. Expo's getDefaultConfig
  //     makes Metro run the *app tree's* `InitializeCore` (plus Expo's winter runtime)
  //     before the entry, and points assets at `@react-native/assets-registry`. But step 4
  //     pins `react-native` itself to the harness copy — so InitializeCore would install
  //     `setImmediate`/TurboModule globals onto the app-tree RN while the app imports the
  //     harness RN, a split-brain that crashes with "Property 'setImmediate' doesn't exist".
  //     Re-point both at the harness RN so the whole bundle uses one RN copy (this is what
  //     the harness's own generated config does).
  const harnessRnCore = path.join(harnessDir, 'node_modules', 'react-native', 'Libraries', 'Core', 'InitializeCore.js');
  finalConfig.serializer = { ...finalConfig.serializer, getModulesRunBeforeMainModule: () => [harnessRnCore] };
  finalConfig.transformer = { ...finalConfig.transformer, assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry' };

  // 3. Node built-in / Vitest-internal stubs. vitest-mobile's own worker imports
  //    `vitest/worker` (a subpath, so not caught by its bare-`vitest` → shim rule),
  //    which statically imports `node:vm`, `node:fs`, jsdom, etc. — none of which exist
  //    on Hermes. Redirect them to the no-op stubs that ship in the vitest-mobile package,
  //    matching its generated `assets/templates/node/metro.config.cjs` (STUBBED_MODULES).
  const stubsDir = path.join(path.dirname(projectRequire.resolve('vitest-mobile/package.json')), 'src', 'metro', 'vitest-stubs');
  const emptyStub = path.join(stubsDir, 'empty.js');
  const stubbedModules = [
    'node:module',
    'node:url',
    'node:path',
    'node:fs',
    'node:fs/promises',
    'node:vm',
    'node:async_hooks',
    'node:perf_hooks',
    'node:timers',
    'node:timers/promises',
    'node:util',
    'node:assert',
    'node:v8',
    'node:console',
    'node:process',
    'node:stream',
    'node:events',
    'node:buffer',
    'node:worker_threads',
    'vite/module-runner',
    '@edge-runtime/vm',
    'happy-dom',
    'jsdom',
    '@opentelemetry/api',
  ];
  const stubFor = new Map(
    stubbedModules.map((name) => {
      const specific = path.join(stubsDir, `${name.replace(':', '/')}.js`);
      return [name, fs.existsSync(specific) ? specific : emptyStub];
    }),
  );

  // 4. Pin harness-tree packages. With both the app and harness trees watched, requests
  //    from app-tree files (our tests) must be steered to the harness copies:
  //    - react / react-native / @react-native/* are dual-installed, and a duplicate
  //      react-native means module-identity mismatches (setImmediate, TurboModules) at
  //      runtime — so they MUST come from the harness (mirrors vitest-mobile's generated
  //      config).
  //    - @babel/runtime is only a transitive dep and, under bun's isolated store, isn't
  //      reachable by a node_modules walk from `tests/`; the harness has it, so pin there
  //      too (its helpers are stateless, so there's no identity concern).
  //    Anchor requests from OUTSIDE the harness to the harness copy; requests already
  //    inside the harness keep their normal nested resolution.
  const harnessAnchor = path.join(harnessDir, 'package.json');
  const harnessDirPrefix = harnessDir + path.sep;
  const isHarnessPinned = (name) =>
    name === 'react' ||
    name === 'react-native' ||
    name.startsWith('react/') ||
    name.startsWith('react-native/') ||
    name.startsWith('@react-native/') ||
    name === '@babel/runtime' ||
    name.startsWith('@babel/runtime/');

  const previousResolveRequest = finalConfig.resolver.resolveRequest;
  finalConfig.resolver = {
    ...finalConfig.resolver,
    resolveRequest(context, moduleName, platform) {
      const stubPath = stubFor.get(moduleName);
      if (stubPath) return { type: 'sourceFile', filePath: stubPath };
      if (isHarnessPinned(moduleName)) {
        const originInHarness =
          typeof context.originModulePath === 'string' && context.originModulePath.startsWith(harnessDirPrefix);
        const nextContext = originInHarness ? context : { ...context, originModulePath: harnessAnchor };
        return context.resolveRequest(nextContext, moduleName, platform);
      }
      return previousResolveRequest
        ? previousResolveRequest(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
    },
  };
}

module.exports = finalConfig;
