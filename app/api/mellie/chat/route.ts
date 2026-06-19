import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The current grounded brain is api_mellie_brain on the bar: it grounds answers in
// control_store.grog_knowledge and returns { ok, reply, answer, voice_url, session_uid, mode }.
// Proxy to it so the front's chat is byte-identical to the live brain — no generic
// model, no un-grounded prompt, no separate chat_messages table. Replaces the earlier
// direct-Groq passthrough (legacy).
const RAIL = process.env.NEXT_PUBLIC_RAIL || 'https://memelli-bar-control.up.railway.app';

export async function POST(req: Request) {
  let b: any = {};
  try {
    b = await req.json();
  } catch {
    /* ignore */
  }
  const text = ((b.text || '') + '').trim();
  if (!text) return NextResponse.json({ ok: false, error: 'text required' }, { status: 400 });

  const sess = cookies().get('mio_sess')?.value;
  try {
    const r = await fetch(`${RAIL}/api/mellie/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sess ? { Cookie: `mio_sess=${sess}` } : {}),
      },
      body: JSON.stringify({ text, session_uid: b.session_uid }),
    });
    const j = await r.json();
    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'brain unreachable', detail: String(e?.message || e) });
  }
}
