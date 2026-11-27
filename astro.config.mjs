import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://iconpdf.com',
  // remove-background is noindexed until its ~26 MB model runtime can be served (Cloudflare 25 MB file cap).
  integrations: [sitemap({ filter: (page) => !page.includes('/remove-background') })],
  server: { port: 4321 },
  vite: {
    worker: { format: 'es' },
    optimizeDeps: { exclude: ['@huggingface/transformers'] },
  },
});
