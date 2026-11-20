import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://iconpdf.com',
  server: { port: 4321 },
  vite: {
    worker: { format: 'es' },
    optimizeDeps: { exclude: ['@huggingface/transformers'] },
  },
});
