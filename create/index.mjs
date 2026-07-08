#!/usr/bin/env node
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const templateDir = join(dirname(fileURLToPath(import.meta.url)), 'template');
const defaultName = 'my-react-native-library';

async function resolveTarget() {
  const argument = process.argv[2];
  if (argument) return argument;
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await readline.question(`Project directory (${defaultName}): `)).trim();
  readline.close();
  return answer || defaultName;
}

function restoreGitignores(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) restoreGitignores(entryPath);
    else if (entry.name === 'gitignore') renameSync(entryPath, join(directory, '.gitignore'));
  }
}

const target = await resolveTarget();
const targetDir = resolve(process.cwd(), target);
const projectName =
  basename(targetDir)
    .toLowerCase()
    .replace(/[^a-z0-9-_.~]+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '') || defaultName;

if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
  console.error(`Error: ${targetDir} already exists and is not empty.`);
  process.exit(1);
}

cpSync(templateDir, targetDir, { recursive: true });
restoreGitignores(targetDir);

const packageJsonPath = join(targetDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
packageJson.name = projectName;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`
Scaffolded ${projectName} in ${targetDir}

Next steps:
  cd ${target}
  git init
  bun install
  git add -A && git commit -m "Initial commit"

Useful commands:
  bun run storybook          # web Storybook at http://localhost:6006
  bun run storybook:native   # Expo dev server for on-device Storybook
  bun run test               # unit + Storybook tests
See AGENTS.md for the full guide (rename the @template/* packages to your own scope).
`);
