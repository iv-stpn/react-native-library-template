---
"create-react-native-library-template": patch
---

Fix `vitest-mobile bundle` crash ("Unexpected module with full source map") on Android CI with RN 0.86+. The harness's npm-installed `metro-runtime` ships `require.js` pre-compiled with an embedded sourceMappingURL; Babel emits a composed source-map object that `metro-source-map@0.84.4` cannot handle. The native Metro config now normalises full source-map objects to empty arrays before serialisation (scoped to vitest-mobile test runs only).
