import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  if (index < 0) {
    return [arg, ''];
  }
  return [arg.slice(0, index), arg.slice(index + 1)];
}));

const testDir = args['--test-dir'] || 'test';
const outDir = args['--out-dir'] || 'build-test';
const cwd = process.cwd();
const testDirPath = path.resolve(cwd, testDir);
const outDirPath = path.resolve(cwd, outDir);

const entries = (await fs.readdir(testDirPath, {withFileTypes: true}))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
  .map((entry) => path.join(testDirPath, entry.name));

if (entries.length === 0) {
  throw new Error('No TypeScript test files found in ' + testDirPath);
}

function resolveLocalImport(resolveDir, importPath) {
  const basePath = path.resolve(resolveDir, importPath);
  const candidates = [
    basePath,
    basePath + '.ts',
    basePath + '.js',
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.js')
  ];
  for (const candidate of candidates) {
    if (fsSync.existsSync(candidate) && fsSync.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return basePath;
}

await fs.rm(outDirPath, {recursive: true, force: true});
await esbuild.build({
  absWorkingDir: cwd,
  bundle: true,
  entryPoints: entries,
  external: ['*'],
  format: 'cjs',
  outbase: testDirPath,
  outdir: outDirPath,
  platform: 'node',
  plugins: [{
    name: 'bundle-local-files',
    setup(build) {
      build.onResolve({filter: /^\./}, (args) => ({
        path: resolveLocalImport(args.resolveDir, args.path)
      }));
    }
  }],
  target: 'es2015'
});
