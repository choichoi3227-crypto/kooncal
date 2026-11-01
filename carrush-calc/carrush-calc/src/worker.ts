import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler';
import { DurableObject } from 'cloudflare:workers';

/** 엘칭방 실시간 군체크 (SQLite-backed Durable Object) */
export class ClubRoom extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS checks (uid TEXT PRIMARY KEY, status TEXT NOT NULL, ts INTEGER NOT NULL)'
    );
  }
  async fetch(req: Request): Promise<Response> {
    const sql = this.ctx.storage.sql;
    if (req.method === 'POST') {
      const b = (await req.json()) as { op: string; uid?: string; status?: string };
      if (b.op === 'set' && b.uid && ['in', 'maybe', 'out'].includes(b.status ?? '')) {
        sql.exec(
          'INSERT INTO checks VALUES (?, ?, ?) ON CONFLICT(uid) DO UPDATE SET status = excluded.status, ts = excluded.ts',
          b.uid, b.status, Date.now()
        );
      } else if (b.op === 'kick' && b.uid) sql.exec('DELETE FROM checks WHERE uid = ?', b.uid);
      else if (b.op === 'reset') sql.exec('DELETE FROM checks');
    }
    return Response.json(sql.exec('SELECT uid, status, ts FROM checks ORDER BY ts').toArray());
  }
}

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);
  const fetch = async (request: Request, env: Env, ctx: ExecutionContext) =>
    await handle(manifest, app, request as any, env as any, ctx as any);
  return { default: { fetch }, ClubRoom };
}
