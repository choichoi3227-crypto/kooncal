// D1/KV 가 없으면 만들고, wrangler.toml 의 자리표시자를 실제 ID 로 치환합니다. (Actions 안에서만 실행)
import { readFileSync, writeFileSync } from 'node:fs';

const { CLOUDFLARE_API_TOKEN: TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT } = process.env;
if (!TOKEN || !ACCOUNT) throw new Error('CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID 시크릿이 필요합니다.');

const api = async (path, init = {}) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
  });
  const j = await r.json();
  if (!j.success) throw new Error(`${path}: ${JSON.stringify(j.errors)}`);
  return j.result;
};

const D1_NAME = 'carrush-db';
const KV_TITLE = 'carrush-goon-calc-kv';

const db =
  (await api(`/d1/database?name=${D1_NAME}`)).find((d) => d.name === D1_NAME) ??
  (await api('/d1/database', { method: 'POST', body: JSON.stringify({ name: D1_NAME }) }));
const kv =
  (await api('/storage/kv/namespaces?per_page=100')).find((k) => k.title === KV_TITLE) ??
  (await api('/storage/kv/namespaces', { method: 'POST', body: JSON.stringify({ title: KV_TITLE }) }));

const toml = readFileSync('wrangler.toml', 'utf8')
  .replace('REPLACE_WITH_D1_ID', db.uuid)
  .replace('REPLACE_WITH_KV_ID', kv.id);
writeFileSync('wrangler.toml', toml);
console.log(`D1 ${db.uuid} / KV ${kv.id} 준비 완료`);
