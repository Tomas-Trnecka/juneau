/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const isLibBuild = mode === 'lib';

  return {
    plugins: [react()],

    server: {
      port: 5200,
    },

    resolve: {
      alias: {
        '@': resolve(dirname, './src'),
      },
    },

    ...(isLibBuild
      ? {
          build: {
            lib: {
              entry: resolve(dirname, 'src/index.ts'),
              name: 'Juneau',
              fileName: 'index',
              formats: ['es', 'cjs'],
            },
            rollupOptions: {
              // React must never be bundled — consumer provides it
              external: ['react', 'react/jsx-runtime', 'react-dom'],
              output: {
                globals: {
                  react: 'React',
                  'react/jsx-runtime': 'ReactJsxRuntime',
                  'react-dom': 'ReactDOM',
                },
                // Keep CSS modules as a single bundled stylesheet
                assetFileNames: 'style[extname]',
              },
            },
            // Don't clear dist — tsc writes .d.ts there first
            emptyOutDir: false,
            sourcemap: true,
            // Target modern environments; consumers can transpile further if needed
            target: 'es2020',
          },
        }
      : {
          // Demo app build (default vite build / dev)
          build: {
            outDir: 'dist-demo',
          },
        }),

    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'jsdom',
            include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
            globals: true,
            setupFiles: ['src/test-setup.ts'],
            env: { NODE_ENV: 'development' },
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, '.storybook'),
            }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  };
});
