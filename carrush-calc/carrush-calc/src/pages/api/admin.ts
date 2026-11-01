import type { APIRoute } from 'astro';
import { json, getSession, sameOrigin } from '../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const s = await getSession(env, request);
  if (s?.role !== 'admin' || !sameOrigin(request)) return json({ error: '권한이 없습니다.' }, 403);
  const { points, deleteUser } = (await request.json().catch(() => ({}))) as { points?: number[]; deleteUser?: string };
  if (deleteUser) { await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(deleteUser).run(); return json({ ok: true }); }
  if (!Array.isArray(points) || points.length !== 8 || !points.every((n) => Number.isInteger(n) && n >= 0 && n <= 100))
    return json({ error: '1~8등 점수를 0~100 정수로 입력하세요.' }, 400);
  await env.KV.put('config:points', JSON.stringify(points));
  return json({ ok: true });
};
