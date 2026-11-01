import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth';
export const onRequest = defineMiddleware(async (ctx, next) => {
  if (!ctx.url.pathname.startsWith('/api/')) ctx.locals.sess = await getSession(ctx.locals.runtime.env, ctx.request);
  const res = await next();
  const h = new Headers(res.headers);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
});
