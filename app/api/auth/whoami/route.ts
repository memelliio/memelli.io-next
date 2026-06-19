import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE, userFromToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return NextResponse.json({ ok: false, error: 'no session' });
  const user = await userFromToken(token);
  if (!user) return NextResponse.json({ ok: false, error: 'invalid or expired session' });
  return NextResponse.json({ ok: true, user });
}
