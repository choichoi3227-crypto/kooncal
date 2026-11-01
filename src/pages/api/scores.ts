import type { APIRoute } from 'astro';
import { json, getSession, getPoints, sameOrigin, ROOM_NAME } from '../../lib/auth';

export const GET: APIRoute = async ({ locals }) => {
  const { results } = await locals.runtime.env.DB
    .prepare('SELECT id, a_name, b_name, a_score, b_score, author, created_at FROM matches ORDER BY created_at DESC LIMIT 20').all();
  return json(results, 200, { 'cache-control': 'public, max-age=10' });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const s = await getSession(env, request);
  if (!s || !sameOrigin(request)) return json({ error: '로그인이 필요합니다.' }, 401);
  const b = (await request.json().catch(() => null)) as { a?: number[]; b?: number[]; aName?: string; bName?: string } | null;
  const valid = (r: unknown): r is number[] => Array.isArray(r) && r.length > 0 && r.length <= 4 && r.every((n) => Number.isInteger(n) && n >= 1 && n <= 8);
  if (!b || !valid(b.a) || !valid(b.b)) return json({ error: '순위 입력이 올바르지 않습니다.' }, 400);
  const pts = await getPoints(env);
  const sum = (r: number[]) => r.reduce((t, n) => t + pts[n - 1], 0);
  const aName = (b.aName || ROOM_NAME).slice(0, 20), bName = (b.bName || '상대군').slice(0, 20);
  await env.DB.prepare('INSERT INTO matches (room,a_name,b_name,a_score,b_score,detail,author,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind(ROOM_NAME, aName, bName, sum(b.a), sum(b.b), JSON.stringify({ a: b.a, b: b.b }), s.id, Date.now()).run();
  return json({ ok: true, a: sum(b.a), b: sum(b.b) });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const s = await getSession(env, request);
  if (s?.role !== 'admin' || !sameOrigin(request)) return json({ error: '권한이 없습니다.' }, 403);
  const { id } = (await request.json().catch(() => ({}))) as { id?: number };
  await env.DB.prepare('DELETE FROM matches WHERE id = ?').bind(id ?? -1).run();
  return json({ ok: true });
};
