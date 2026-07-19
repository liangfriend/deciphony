import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',
  server: { port: 5176, open: '/test.html' },
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'test.html')
    }
  }
});
