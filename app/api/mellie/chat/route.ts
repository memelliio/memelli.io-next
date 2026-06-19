import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool, SCHEMA } from '@/lib/db';
import { COOKIE, userFromToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM = `You are Mellie, the assistant for Memelli — credit, funding, and business formation.
Be concise, warm, and practical. Help with credit repair, funding readiness, and starting/running a business.
If the user is ready to act, guide them to sign up. Never invent account details.`;

async function logMessage(sessionUid: string, role: string, content: string) {
  try {
    await pool.query(
      `INSERT INTO ${SCHEMA}.chat_messages (session_uid, role, content, created_at) VALUES ($1,$2,$3,NOW())`,
      [sessionUid, role, content],
    );
  } catch {
    /* logging is best-effort; never block the reply */
  }
}

export async function POST(req: Request) {
  let b: any = {};
  try {
    b = await req.json();
  } catch {
    /* ignore */
  }
  const text = ((b.text || '') + '').trim();
  if (!text) return NextResponse.json({ ok: false, error: 'text required' }, { status: 400 });

  const token = cookies().get(COOKIE)?.value;
  const user = await userFromToken(token);
  const sessionUid = (user && user.user_id) || b.session_uid || 'guest';

  await logMessage(sessionUid, 'user', text);

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    const reply =
      "I'm here — ask me about credit, funding, or starting your business. (Live brain key not set on this deploy yet.)";
    await logMessage(sessionUid, 'assistant', reply);
    return NextResponse.json({ ok: true, reply, session_uid: sessionUid });
  }

  try {
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM + (user ? `\nUser is signed in: ${user.email}.` : '') },
          { role: 'user', content: text },
        ],
        temperature: 0.6,
        max_tokens: 600,
      }),
    });
    const j = await r.json();
    const reply = j?.choices?.[0]?.message?.content?.trim() || 'No reply';
    await logMessage(sessionUid, 'assistant', reply);
    return NextResponse.json({ ok: true, reply, session_uid: sessionUid });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'brain error', detail: String(e?.message || e) });
  }
}
