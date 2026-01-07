import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'middleware'
  }),
  outDir: './functions/dist',
  server: {
    port: 3000,
    host: true
  },
  vite: {
    ssr: {
      external: ['firebase-admin']
    },
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, './shared'),
      },
    }
  }
});
