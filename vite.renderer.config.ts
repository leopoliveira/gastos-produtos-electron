import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


const rendererTargetName = 'main_window';

// https://vitejs.dev/config
export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '.vite', 'renderer', rendererTargetName),
    emptyOutDir: true,
  },
});
