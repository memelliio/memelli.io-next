import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool, SCHEMA } from '@/lib/db';
import { COOKIE, cookieString } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    await pool.query(
      `UPDATE ${SCHEMA}.app_sessions SET revoked_at=NOW() WHERE token=$1`,
      [token],
    );
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', cookieString('', 0));
  return res;
}
