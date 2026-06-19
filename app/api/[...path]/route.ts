import { NextRequest, NextResponse } from 'next/server';
import { dispatch, ShimReq } from '@/app/lib/dispatch';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(req: NextRequest) {
  const url = new URL(req.url);
  let body: any = {};
  try { if (req.method !== 'GET' && req.method !== 'HEAD') body = await req.json(); } catch (_) {}
  const headers: Record<string, string> = {}; req.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  const query: Record<string, string> = {}; url.searchParams.forEach((v, k) => { query[k] = v; });
  const shim: ShimReq = { method: req.method, headers, body, query, url: url.pathname + url.search };
  const out = await dispatch(url.pathname, shim);
  const res = NextResponse.json(out.body, { status: out.status });
  for (const [k, v] of Object.entries(out.headers || {})) { try { res.headers.set(k, v as string); } catch (_) {} }
  return res;
}
export const GET = handle; export const POST = handle; export const PUT = handle; export const DELETE = handle; export const PATCH = handle;
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } }); }
