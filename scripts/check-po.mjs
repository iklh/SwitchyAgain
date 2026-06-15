import {readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localeRoot = path.join(root, 'resources/locales');

function runMsgfmt(args) {
  return spawnSync('msgfmt', args, {
    encoding: 'utf8',
    windowsHide: true
  });
}

function printMissingMsgfmt() {
  console.error('msgfmt was not found. Install GNU gettext before running this check.');
  console.error('');
  console.error('Install examples:');
  console.error('  Debian/Ubuntu: sudo apt install gettext');
  console.error('  macOS:         brew install gettext');
}

async function findPoFiles(dir, result = []) {
  const entries = await readdir(dir, {withFileTypes: true});
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findPoFiles(entryPath, result);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.po')) {
      result.push(entryPath);
    }
  }
  return result;
}

const versionCheck = runMsgfmt(['--version']);
if (versionCheck.error?.code === 'ENOENT') {
  printMissingMsgfmt();
  process.exit(1);
}
if (versionCheck.status !== 0) {
  console.error(versionCheck.stderr || versionCheck.stdout || 'Failed to run msgfmt --version.');
  process.exit(versionCheck.status || 1);
}

const poFiles = (await findPoFiles(localeRoot)).sort();
if (poFiles.length === 0) {
  console.error('No .po files found under resources/locales.');
  process.exit(1);
}

const failures = [];
for (const file of poFiles) {
  const result = runMsgfmt(['--check', '--check-format', '-o', os.devNull, file]);
  if (result.status !== 0) {
    failures.push({
      file: path.relative(root, file),
      output: `${result.stdout || ''}${result.stderr || ''}`.trim()
    });
  }
}

if (failures.length > 0) {
  console.error('PO checks failed:');
  for (const failure of failures) {
    console.error(`\n${failure.file}`);
    console.error(failure.output || 'msgfmt failed without output.');
  }
  process.exit(1);
}

console.log(`ok po files (${poFiles.length})`);
