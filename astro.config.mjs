import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

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
    }
  }
});
