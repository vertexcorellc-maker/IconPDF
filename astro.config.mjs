import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://iconpdf.com',
  integrations: [sitemap()],
  server: { port: 4321 },
  vite: {
    worker: { format: 'es' },
    optimizeDeps: { exclude: ['@huggingface/transformers'] },
  },
});
