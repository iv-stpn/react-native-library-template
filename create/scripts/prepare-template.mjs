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
  if (content.includes('template-exclude:start')) writeFileSync(destination, stripExcludedBlocks(content.toString('utf8')));
  else cpSync(source, destination);
}

console.log(`Copied ${trackedFiles.length} files into ${templateDir}`);
