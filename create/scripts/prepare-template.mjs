import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Snapshots the repository's tracked files into ./template so the published
// package is self-contained. Runs automatically via the `prepack` script.

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageDir, '..');
const templateDir = join(packageDir, 'template');

const output = execFileSync('git', ['-C', repoRoot, 'ls-files', '-z'], { encoding: 'utf8' });
const trackedFiles = output.split('\0').filter((file) => file.length > 0 && !file.startsWith('create/'));

rmSync(templateDir, { recursive: true, force: true });

for (const file of trackedFiles) {
  // npm never includes .gitignore files in tarballs; ship them renamed and
  // let the CLI rename them back when scaffolding.
  const target = basename(file) === '.gitignore' ? join(dirname(file), 'gitignore') : file;
  const destination = join(templateDir, target);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(repoRoot, file), destination);
}

console.log(`Copied ${trackedFiles.length} files into ${templateDir}`);
