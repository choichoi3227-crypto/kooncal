import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
  const urls = ['/', '/room'].map((p) => `<url><loc>${new URL(p, site)}</loc><changefreq>daily</changefreq></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' } });
};
