#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Run changeset version (bumps workspace packages if any changesets exist)
execFileSync('bun', ['run', 'changeset', 'version'], { cwd: root, stdio: 'inherit' });

// Always bump the scaffolder patch version. This is a template repo: when changesets exist,
// the scaffolder should ship alongside the template changes. The release workflow publishes
// it when the version differs from npm.
const createPackagePath = resolve(root, 'create/package.json');
const createPackage = JSON.parse(readFileSync(createPackagePath, 'utf8'));
const [major, minor, patch] = createPackage.version.split('.').map(Number);
createPackage.version = `${major}.${minor}.${patch + 1}`;
writeFileSync(createPackagePath, `${JSON.stringify(createPackage, null, 2)}\n`);
console.log(`Bumped create-react-native-library-template to ${createPackage.version}`);
