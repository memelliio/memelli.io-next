'use client';

import { useEffect, useRef, useState } from 'react';
import Scene from './Scene';

type Mode = 'signup' | 'login';

export default function Home() {
  const [ask, setAsk] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const [drawer, setDrawer] = useState(false);
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [msgGood, setMsgGood] = useState(false);
  const [working, setWorking] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [who, setWho] = useState<string>('');

  const replyRef = useRef<HTMLDivElement>(null);

  async function check() {
    try {
      const r = await fetch('/api/auth/whoami', { credentials: 'include' });
      const j = await r.json();
      if (j && j.ok && j.user) {
        setSignedIn(true);
        setWho(j.user.full_name || j.user.email || '');
      } else {
        setSignedIn(false);
      }
    } catch {
      setSignedIn(false);
    }
  }

  useEffect(() => {
    check();
  }, []);

  async function sendAsk() {
    const x = ask.trim();
    if (!x || busy) return;
    setBusy(true);
    setReply('Memelli is thinking…');
    setAsk('');
    try {
      const r = await fetch('/api/mellie/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: x }),
      });
      const j = await r.json();
      setReply(j.reply || j.answer || j.error || 'No reply');
    } catch {
      setReply('Connection error');
    } finally {
      setBusy(false);
    }
  }

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setMsgGood(false);
    setMsg(mode === 'login' ? 'Signing in…' : 'Creating…');
    const url = mode === 'login' ? '/api/auth/login' : '/api/signup';
    const body =
      mode === 'login'
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), phone: phone.trim(), password };
    try {
      const r = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j && j.ok) {
        setMsgGood(true);
        const nm = name ? name.split(' ')[0] : '';
        setMsg((mode === 'login' ? 'Signed in' : 'Welcome') + (nm ? ', ' + nm : '') + " — you're in.");
        setTimeout(() => {
          setDrawer(false);
          check();
        }, 1400);
      } else {
        setMsg((j && j.error) || 'Could not ' + (mode === 'login' ? 'sign in' : 'create account') + '.');
      }
    } catch {
      setMsg('Connection error.');
    } finally {
      setWorking(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setSignedIn(false);
    setWho('');
  }

  return (
    <>
      <Scene />

      <div className="brand">
        <div className="crown">♛</div>
        <div className="wordmark">MEMELLI</div>
        <div className="tag">Credit · Funding · Business — one account.</div>
      </div>

      {signedIn ? (
        <div className="signtab live" onClick={logout} title="Click to sign out">
          {who ? 'Live · ' + who.split(' ')[0] : 'Live'}
        </div>
      ) : (
        <div
          className="signtab"
          onClick={() => {
            setMode('signup');
            setDrawer(true);
          }}
        >
          Sign up
        </div>
      )}

      <div id="barwrap">
        <div id="bar">
          <input
            id="ask"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendAsk()}
            placeholder="Ask Memelli about credit, funding, or your business…"
          />
          <button id="sendb" onClick={sendAsk} aria-label="send">
            ➤
          </button>
        </div>
        {reply && (
          <div id="reply" ref={replyRef}>
            {reply}
          </div>
        )}
      </div>

      <div id="dr" className={drawer ? 'open' : ''}>
        <span id="drx" onClick={() => setDrawer(false)}>
          ×
        </span>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <div className="ds">
          {mode === 'login' ? 'Sign in to your account.' : 'One account — credit, funding, and business.'}
        </div>
        <form onSubmit={submitAuth} autoComplete="off">
          {mode === 'signup' && (
            <div className="dfield">
              <label>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="dfield">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode === 'signup' && (
            <div className="dfield">
              <label>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          )}
          <div className="dfield">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="dgo" type="submit" disabled={working}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          <div className="dmsg" style={{ color: msgGood ? '#9fe9bd' : '#ffb3bb' }}>
            {msg}
          </div>
        </form>
        <div className="dalt">
          <a onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Already have one? Sign in' : 'New here? Create account'}
          </a>
        </div>
      </div>
    </>
  );
}
