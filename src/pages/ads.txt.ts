import type { APIRoute } from 'astro';
import { ADSENSE } from '../site';

export const prerender = true;

// AdSense requires /ads.txt to authorise your publisher ID. Generated from
// ADSENSE.client so it can never drift from the ad code on the pages.
export const GET: APIRoute = () => {
  const pub = ADSENSE.client.replace(/^ca-/, '');
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
