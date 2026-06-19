# Memelli Bar — Next.js

The home page + customer flow as a **normal Next.js app** (App Router), deployed as the bar.
Replaces the database-stored `*` node design with standard server code Railway runs natively.

## What it does (same functions as the live flow)

| Route | Method | Function |
|---|---|---|
| `/` | GET | Home: particle field, brand, Ask Memelli bar, signup/login drawer |
| `/api/signup` | POST | Create user in `app_users`, open session, set `mio_sess` cookie |
| `/api/auth/login` | POST | scrypt verify, open session, set `mio_sess` |
| `/api/auth/whoami` | GET | Resolve `mio_sess` → user (joins `app_sessions` + `app_users`) |
| `/api/auth/logout` | POST | Revoke session, clear cookie |
| `/api/mellie/chat` | POST | Ask Memelli — logs `chat_messages`, calls the brain (Groq) |

Auth is **byte-for-byte compatible** with the existing live nodes: same `salt:hash` scrypt,
same `*sess*<hex>*` token, same cookie attributes, same `control_store` tables — so existing
customers and sessions keep working.

## Env

- `DATABASE_URL` — Postgres connection to `control_store` (required)
- `PGSSL` — set to `disable` for non-SSL local Postgres
- `GROQ_API_KEY` — optional; enables the live Ask Memelli brain
- `GROQ_MODEL` — optional model override

## Dev

```
npm install
DATABASE_URL=... npm run dev
```

## Deploy (Railway)

Dockerfile-based standalone build. Set `DATABASE_URL` (and optionally `GROQ_API_KEY`) on the service.
