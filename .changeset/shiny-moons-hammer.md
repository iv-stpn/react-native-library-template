---
"@template/ui": patch
---

Remove `.tsx` extensions from relative imports in test and story files — they made `tsc --noEmit` fail with TS5097 since `allowImportingTsExtensions` is not enabled.
