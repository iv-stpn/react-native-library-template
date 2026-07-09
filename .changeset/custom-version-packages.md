---
"@template/ui": patch
---

Add custom `version-packages` script that bumps the scaffolder version whenever changesets are consumed, so the template repo's release workflow republishes `create-react-native-library-template` alongside library changes. Update AGENTS.md to reflect the flow: only the scaffolder publishes from the template repo; `@template/ui` stays private. No runtime changes to the published package.