// Faithful drop-in for the bar's node dispatcher.
// MEMELLI_BAR_APIS (endpoint->node) -> load code_text -> run module.exports.handle(req,reply,helpers).
import { Pool } from 'pg';
const g = globalThis as any;
export const SCHEMA = 'control_store';
const NODES = `${SCHEMA}."*SPAWN*TRIGGER*NODES*"`;
export const pool: Pool = g.__pgpool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
  max: 10,
});
if (!g.__pgpool) g.__pgpool = pool;
const nodeRequire = eval('require');
let _map: Record<string, string> | null = null; let _mapAt = 0;
async function apiMap(): Promise<Record<string, string>> {
  if (_map && Date.now() - _mapAt < 30000) return _map;
  const m: Record<string, string> = {};
  try {
    const r = await pool.query(`SELECT value FROM ${SCHEMA}.front_control_vars WHERE name='MEMELLI_BAR_APIS'`);
    let v: any = r.rows[0]?.value; if (typeof v === 'string') v = JSON.parse(v);
    for (const e of v?.endpoints || []) if (e.endpoint && e.node) m[e.endpoint] = e.node;
  } catch (_) {}
  _map = m; _mapAt = Date.now(); return m;
}
export type ShimReq = { method: string; headers: Record<string, string>; body: any; query: any; url: string };
export async function dispatch(endpoint: string, req: ShimReq): Promise<{ status: number; headers: Record<string, string>; body: any }> {
  const map = await apiMap();
  let node = map[endpoint];
  if (!node) node = 'api_' + endpoint.replace(/^\/+api\/+/, '').replace(/\/+$/, '').replace(/\//g, '_');
  let r;
  try { r = await pool.query(`SELECT code_text FROM ${NODES} WHERE name=$1 AND active=true LIMIT 1`, [node]); }
  catch (e: any) { return { status: 500, headers: {}, body: { ok: false, error: 'db', detail: String(e?.message || e) } }; }
  if (!r.rows[0]) return { status: 404, headers: {}, body: { ok: false, error: 'no node', endpoint, node } };
  const reply: any = { statusCode: 200, _h: {} as Record<string, string>,
    code(n: number){ this.statusCode = n; return this; }, header(k: string, v: string){ this._h[k] = v; return this; },
    send(x: any){ this._sent = x; return x; }, type(){ return this; } };
  const helpers = { pool, schema: SCHEMA, cache: {}, fetch: (globalThis as any).fetch, env: process.env };
  try {
    const mod: any = { exports: {} };
    const fn = new Function('module','exports','require','Buffer','process','fetch','helpers','req','reply', r.rows[0].code_text);
    fn(mod, mod.exports, nodeRequire, Buffer, process, (globalThis as any).fetch, helpers, req, reply);
    const handler = mod.exports.handle;
    if (typeof handler !== 'function') return { status: 500, headers: reply._h, body: { ok: false, error: 'no handle', node } };
    const result = await handler(req, reply, helpers);
    const body = result !== undefined ? result : reply._sent;
    return { status: reply.statusCode || 200, headers: reply._h, body };
  } catch (e: any) { return { status: 500, headers: {}, body: { ok: false, error: 'node error', node, detail: String(e?.message || e) } }; }
}
