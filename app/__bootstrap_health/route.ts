import { NextResponse } from 'next/server';
import { pool, dispatch } from '@/app/lib/dispatch';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Rigorous gate: healthy ONLY if DB connects AND the dispatcher runs a real node.
// Railway healthcheck -> a broken dispatcher fails here -> the OLD bar stays (zero breakage).
export async function GET() {
  try {
    await pool.query('SELECT 1');
    const live = await dispatch('/api/live_data', { method: 'POST', headers: {}, body: {}, query: {}, url: '/api/live_data' });
    const ok = live.status === 200 && live.body && (live.body.ok === true || live.body.counts);
    if (!ok) return NextResponse.json({ ok: false, stage: 'dispatch', live }, { status: 503 });
    return NextResponse.json({ ok: true, db: true, dispatch: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 503 }); }
}
