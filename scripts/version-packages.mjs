#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Run changeset version
execFileSync('bun', ['run', 'changeset', 'version'], { cwd: root, stdio: 'inherit' });

// Bump the scaffolder version when changesets are consumed. This is a template repo;
// the scaffolder must republish when template files change. Always bump it: if no changesets
// existed, the version PR doesn't open and this doesn't run; if changesets exist, they're
// for template changes and the scaffolder should ship alongside.
const createPackagePath = resolve(root, 'create/package.json');
const createPackage = JSON.parse(readFileSync(createPackagePath, 'utf8'));
const [major, minor, patch] = createPackage.version.split('.').map(Number);
createPackage.version = `${major}.${minor}.${patch + 1}`;
writeFileSync(createPackagePath, `${JSON.stringify(createPackage, null, 2)}\n`);
console.log(`Bumped create-react-native-library-template to ${createPackage.version}`);
