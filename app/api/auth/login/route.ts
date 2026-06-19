import { NextResponse } from 'next/server';
import { pool, SCHEMA } from '@/lib/db';
import { verifyPassword, newSessionToken, createSession, cookieString, ipOf, uaOf } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Byte-compatible with live auth: reads control_store.app_users, single salt:hash password_hash.
export async function POST(req: Request) {
  let b: any = {};
  try {
    b = await req.json();
  } catch {
    /* ignore */
  }
  const email = ((b.email || '') + '').toLowerCase().trim();
  if (!email || !b.password) {
    return NextResponse.json({ ok: false, error: 'email + password required' }, { status: 400 });
  }

  const u = await pool.query(`SELECT id, password_hash FROM ${SCHEMA}.app_users WHERE email=$1`, [email]);
  const row = u.rows[0];
  if (!row || !verifyPassword(b.password, row.password_hash)) {
    return NextResponse.json({ ok: false, error: 'invalid credentials' }, { status: 401 });
  }

  const token = newSessionToken();
  await createSession(token, row.id, ipOf(req), uaOf(req));

  const res = NextResponse.json({ ok: true, user_id: row.id, token });
  res.headers.set('Set-Cookie', cookieString(token));
  return res;
}
