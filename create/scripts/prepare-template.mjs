import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Snapshots the repository's tracked files into ./template so the published
// package is self-contained. Runs automatically via the `prepack` script.

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageDir, '..');
const templateDir = join(packageDir, 'template');

// Skipped: this package itself, and pending changesets (release notes for the
// template repo, not for freshly scaffolded projects).
const isPendingChangeset = (file) => file.startsWith('.changeset/') && file.endsWith('.md') && file !== '.changeset/README.md';

const output = execFileSync('git', ['-C', repoRoot, 'ls-files', '-z'], { encoding: 'utf8' });
const trackedFiles = output
  .split('\0')
  .filter((file) => file.length > 0 && !file.startsWith('create/') && !isPendingChangeset(file));

rmSync(templateDir, { recursive: true, force: true });

// Removes line ranges delimited by "template-exclude:start" / "template-exclude:end"
// marker comments — repo-only bits (like the workflow step publishing this very
// package) that must not end up in scaffolded projects.
function stripExcludedBlocks(content) {
  const lines = content.split('\n');
  const kept = [];
  let excluding = false;
  // A marker is a real comment (`<!-- ... -->` or `# ...`). Ignore backtick-wrapped prose
  // mentions of the tokens — AGENTS.md documents the marker names and must not self-truncate.
  const hasMarker = (line, token) => line.includes(token) && !line.includes(`\`${token}\``);
  for (const line of lines) {
    if (hasMarker(line, 'template-exclude:start')) {
      excluding = true;
      // Also drop the blank line that precedes the stripped block.
      if (kept.at(-1) === '') kept.pop();
    } else if (hasMarker(line, 'template-exclude:end')) excluding = false;
    else if (!excluding) kept.push(line);
  }
  return kept.join('\n');
}

for (const file of trackedFiles) {
  // npm never includes .gitignore files in tarballs; ship them renamed and
  // let the CLI rename them back when scaffolding.
  const target = basename(file) === '.gitignore' ? join(dirname(file), 'gitignore') : file;
  const destination = join(templateDir, target);
  mkdirSync(dirname(destination), { recursive: true });
  const source = join(repoRoot, file);
  const content = readFileSync(source);
  if (content.includes('template-exclude:start')) {
    const stripped = stripExcludedBlocks(content.toString('utf8'));
    if (stripped.trim().length > 0) writeFileSync(destination, stripped);
  } else cpSync(source, destination);
}

// The template repo and a scaffolded project have opposite release goals, so three files are
// transformed in the snapshot (they can't use the comment-based template-exclude markers —
// JSON has no comments):
//
// 1. `packages/ui/package.json`: drop `private`. In the repo the library is placeholder code
//    kept unpublished; a scaffolded project exists to publish its library.
const libraryPackageJsonPath = join(templateDir, 'packages/ui/package.json');
const { private: _private, ...libraryPackageJson } = JSON.parse(readFileSync(libraryPackageJsonPath, 'utf8'));
writeFileSync(libraryPackageJsonPath, `${JSON.stringify(libraryPackageJson, null, 2)}\n`);

// 2. root `package.json`: drop `create` from `workspaces`. The scaffolder isn't shipped into
//    scaffolded projects, so leaving it would make `bun install` fail on a missing workspace.
const rootPackageJsonPath = join(templateDir, 'package.json');
const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf8'));
rootPackageJson.workspaces = rootPackageJson.workspaces.filter((glob) => glob !== 'create');
writeFileSync(rootPackageJsonPath, `${JSON.stringify(rootPackageJson, null, 2)}\n`);

// 3. `.changeset/config.json`: drop `@template/ui` from `ignore`. The repo ignores the library
//    (only the scaffolder releases from here); a scaffolded project must release its library.
const changesetConfigPath = join(templateDir, '.changeset/config.json');
const changesetConfig = JSON.parse(readFileSync(changesetConfigPath, 'utf8'));
changesetConfig.ignore = (changesetConfig.ignore ?? []).filter((name) => name !== '@template/ui');
writeFileSync(changesetConfigPath, `${JSON.stringify(changesetConfig, null, 2)}\n`);

console.log(`Copied ${trackedFiles.length} files into ${templateDir}`);
