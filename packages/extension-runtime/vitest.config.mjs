import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@switchyagain/proxy-engine': resolve(root, '../proxy-engine/src/index.ts')
    }
  },
  test: {
    allowOnly: false,
    environment: 'node',
    fileParallelism: false,
    globals: true,
    include: ['test/*.ts']
  }
});
