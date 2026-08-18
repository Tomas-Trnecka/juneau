import { defineConfig } from 'vite';
import { resolve } from 'path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(dirname, 'src/server/index.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // zod is a peer dep for server consumers — don't bundle it
      external: ['zod'],
    },
    outDir: 'dist/server',
    emptyOutDir: false,
    sourcemap: true,
    target: 'es2020',
  },
});
