import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

function copyExternalNodeModulesForMainBuild(moduleNames: string[]): Plugin {
  let root: string;
  let outDir: string;
  return {
    name: 'copy-external-node-modules',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async writeBundle() {
      await Promise.all(
        moduleNames.map(async (name) => {
          const from = path.join(root, 'node_modules', name);
          const to = path.join(outDir, 'node_modules', name);
          await fs.cp(from, to, { recursive: true, dereference: true });
        }),
      );
    },
  };
}

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    copyExternalNodeModulesForMainBuild(['sqlite', 'sqlite3', 'bindings', 'file-uri-to-path']),
  ],
  build: {
    rollupOptions: {
      external: ['sqlite3', 'sqlite'],
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
});
