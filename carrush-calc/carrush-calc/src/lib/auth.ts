const enc = new TextEncoder();
export type Sess = { id: string; role: 'admin' | 'user' };
export const DEFAULT_POINTS = [10, 8, 6, 5, 4, 3, 2, 1];
export const ROOM_NAME = '엘칭방';

export const json = (d: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', ...headers } });

export async function hashPw(pw: string, salt: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, k, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getSession(env: Env, req: Request): Promise<Sess | null> {
  const m = req.headers.get('cookie')?.match(/(?:^|; )sid=([\w-]+)/);
  return m ? await env.KV.get<Sess>(`s:${m[1]}`, 'json') : null;
}

export async function createSession(env: Env, s: Sess) {
  const t = crypto.randomUUID();
  await env.KV.put(`s:${t}`, JSON.stringify(s), { expirationTtl: 604800 });
  return `sid=${t}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

export async function destroySession(env: Env, req: Request) {
  const m = req.headers.get('cookie')?.match(/(?:^|; )sid=([\w-]+)/);
  if (m) await env.KV.delete(`s:${m[1]}`);
  return 'sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export async function getPoints(env: Env): Promise<number[]> {
  const p = await env.KV.get<number[]>('config:points', 'json');
  return Array.isArray(p) && p.length === 8 ? p : DEFAULT_POINTS;
}

export function sameOrigin(req: Request) {
  const o = req.headers.get('origin');
  return !o || o === new URL(req.url).origin;
}

/** 로그인/가입 시도 제한: IP당 10분에 실패 8회 */
const rlKey = (req: Request) => `rl:${req.headers.get('cf-connecting-ip') ?? 'local'}`;
export async function isLimited(env: Env, req: Request) {
  return Number((await env.KV.get(rlKey(req))) ?? 0) >= 8;
}
export async function addFail(env: Env, req: Request) {
  const n = Number((await env.KV.get(rlKey(req))) ?? 0) + 1;
  await env.KV.put(rlKey(req), String(n), { expirationTtl: 600 });
}
