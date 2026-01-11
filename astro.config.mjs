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
    server: {
      host: '0.0.0.0',
      // HMR configurato per sviluppo locale
      hmr: {
        host: 'localhost',
        clientPort: 3000
      },
      // Disabilita il controllo dell'host per permettere richieste da Docker
      strictPort: false,
      // Disabilita completamente il check dell'host per test E2E
      watch: {
        usePolling: true
      }
    },
    // Previene il blocco delle richieste da host non localhost
    preview: {
      host: '0.0.0.0'
    },
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
