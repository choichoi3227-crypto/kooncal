import type { APIRoute } from 'astro';
import { json, hashPw, createSession, destroySession, sameOrigin, isLimited, addFail } from '../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  if (!sameOrigin(request)) return json({ error: '잘못된 요청입니다.' }, 403);
  const b = (await request.json().catch(() => ({}))) as { action?: string; id?: string; pw?: string };

  if (b.action === 'logout') {
    return json({ ok: true }, 200, { 'set-cookie': await destroySession(env, request) });
  }
  if (await isLimited(env, request)) return json({ error: '시도 횟수가 많습니다. 10분 뒤 다시 시도하세요.' }, 429);
  const id = (b.id ?? '').trim(), pw = b.pw ?? '';
  if (!/^[A-Za-z0-9가-힣_]{2,16}$/.test(id)) return json({ error: '아이디는 2~16자 한글/영문/숫자/_ 만 가능합니다.' }, 400);
  if (pw.length < 6 || pw.length > 64) return json({ error: '비밀번호는 6~64자여야 합니다.' }, 400);

  // 관리자 (secret 기반)
  if (id === env.ADMIN_ID) {
    if (b.action === 'signup') return json({ error: '사용할 수 없는 아이디입니다.' }, 409);
    const a = await hashPw(pw, 'admin'), c = await hashPw(env.ADMIN_PASSWORD, 'admin');
    if (a !== c) { await addFail(env, request); return json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401); }
    return json({ ok: true, role: 'admin' }, 200, { 'set-cookie': await createSession(env, { id, role: 'admin' }) });
  }

  if (b.action === 'signup') {
    const salt = crypto.randomUUID();
    try {
      await env.DB.prepare('INSERT INTO users (id, salt, hash, created_at) VALUES (?,?,?,?)')
        .bind(id, salt, await hashPw(pw, salt), Date.now()).run();
    } catch {
      return json({ error: '이미 사용 중인 아이디입니다.' }, 409);
    }
    return json({ ok: true }, 200, { 'set-cookie': await createSession(env, { id, role: 'user' }) });
  }

  if (b.action === 'login') {
    const u = await env.DB.prepare('SELECT salt, hash FROM users WHERE id = ?').bind(id).first<{ salt: string; hash: string }>();
    if (!u || (await hashPw(pw, u.salt)) !== u.hash) { await addFail(env, request); return json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401); }
    return json({ ok: true }, 200, { 'set-cookie': await createSession(env, { id, role: 'user' }) });
  }
  return json({ error: '잘못된 요청입니다.' }, 400);
};
