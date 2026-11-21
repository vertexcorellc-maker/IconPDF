import type { APIRoute } from 'astro';
import { SITE_NAME, SITE_TAGLINE, TOOLS } from '../site';

export const prerender = true;

const SITE = 'https://iconpdf.com';

export const GET: APIRoute = () => {
  const ready = TOOLS.filter((t) => t.ready);
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_TAGLINE}. Merge, split, compress, convert, edit and secure PDFs with no uploads, no sign-up and no limits — every operation runs locally in the user's own browser.`,
    '',
    `${SITE_NAME} is a free, privacy-first web app for working with PDFs and images. Files never leave the user's device, there is no account or sign-up, nothing is uploaded to a server, and it works offline.`,
    '',
    '## Tools',
    ...ready.map((t) => `- [${t.title}](${SITE}/${t.slug}): ${t.blurb}`),
    '',
    '## Key facts',
    '- Price: free and unlimited.',
    '- Privacy: 100% in-browser; no uploads, no sign-up, file contents are never sent to a server.',
    '- Platform: any modern web browser on Windows, macOS, Linux, Android or iOS.',
    '',
    '## Links',
    `- Home: ${SITE}/`,
    `- Sitemap: ${SITE}/sitemap-index.xml`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
