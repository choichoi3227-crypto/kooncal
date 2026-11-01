import type { APIRoute } from 'astro';
import { json, getSession, sameOrigin, ROOM_NAME } from '../../lib/auth';

const stub = (env: Env) => env.ROOM.get(env.ROOM.idFromName(ROOM_NAME));
const call = (env: Env, body?: unknown) =>
  stub(env).fetch('https://room/', body ? { method: 'POST', body: JSON.stringify(body) } : undefined);

export const GET: APIRoute = async ({ locals }) =>
  json(await (await call(locals.runtime.env)).json(), 200, { 'cache-control': 'no-store' });

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const s = await getSession(env, request);
  if (!s || !sameOrigin(request)) return json({ error: '로그인이 필요합니다.' }, 401);
  const b = (await request.json().catch(() => ({}))) as { status?: string; op?: string; uid?: string };
  if (b.op === 'kick' || b.op === 'reset') {
    if (s.role !== 'admin') return json({ error: '권한이 없습니다.' }, 403);
    return json(await (await call(env, { op: b.op, uid: b.uid })).json());
  }
  return json(await (await call(env, { op: 'set', uid: s.id, status: b.status })).json());
};
