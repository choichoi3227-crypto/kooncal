/// <reference types="astro/client" />
interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ROOM: DurableObjectNamespace;
  ADMIN_ID: string;
  ADMIN_PASSWORD: string;
}
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;
declare namespace App { interface Locals extends Runtime {} }
declare namespace App { interface Locals { sess?: import('./lib/auth').Sess | null } }
