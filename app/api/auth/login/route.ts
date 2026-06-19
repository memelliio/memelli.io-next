import { NextResponse } from 'next/server';
import { pool, SCHEMA } from '@/lib/db';
import {
  verifyPassword,
  newSessionToken,
  createSession,
  cookieString,
  ipOf,
  uaOf,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const u = await pool.query(
    `SELECT id, password_hash FROM ${SCHEMA}.app_users WHERE email=$1`,
    [email],
  );
  if (!u.rows[0] || !verifyPassword(b.password, u.rows[0].password_hash)) {
    return NextResponse.json({ ok: false, error: 'invalid credentials' }, { status: 401 });
  }

  const token = newSessionToken();
  await createSession(token, u.rows[0].id, ipOf(req), uaOf(req));

  const res = NextResponse.json({ ok: true, user_id: u.rows[0].id, token });
  res.headers.set('Set-Cookie', cookieString(token));
  return res;
}
