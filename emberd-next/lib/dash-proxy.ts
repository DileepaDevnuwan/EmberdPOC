// Server-only: the "host product back end". The browser never sees these secrets.
import 'server-only';

type Cached = { token: string; expiresAt: number };
const cache: Record<string, Cached | undefined> = {};

const LIVE_BASE = process.env.DASH_LIVE_BASE ?? 'http://localhost:5150';
const HARDCODED_BASE = process.env.DASH_HARDCODED_BASE ?? 'http://localhost:5300';
const REMOTE_BASE = process.env.DASH_REMOTE_BASE ?? 'https://java01-dashboard.gears-int.com';

type Target = { key: 'live' | 'remote'; base: string; clientId?: string; clientSecret?: string };

const TARGETS: Record<'live' | 'remote', Target> = {
  live: { key: 'live', base: LIVE_BASE, clientId: process.env.DASH_CLIENT_ID, clientSecret: process.env.DASH_CLIENT_SECRET },
  remote: { key: 'remote', base: REMOTE_BASE, clientId: process.env.DASH_REMOTE_CLIENT_ID, clientSecret: process.env.DASH_REMOTE_CLIENT_SECRET },
};

async function dashboardToken(target: Target): Promise<string> {
  const c = cache[target.key];
  if (c && c.expiresAt - 30_000 > Date.now()) return c.token;
  const res = await fetch(`${target.base}/api/v1/embed/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      clientId: target.clientId ?? '',
      clientSecret: target.clientSecret ?? '',
      user: {
        // The live dashboards were made by the POC user 'admin' (owner-based visibility); set DASH_USER_ID=next-admin for a fresh user.
        id: process.env.DASH_USER_ID ?? 'admin',
        email: 'admin@next.demo',
        fullName: 'Next Admin',
        roles: ['Admin'],
        capabilities: ['TenantAdmin'],
      },
    }),
  });
  if (!res.ok) throw new Error(`Dashboard token request failed: ${res.status}`);
  const json = (await res.json()) as { token: string; expiresAt?: string };
  const expiresAt = json.expiresAt ? Date.parse(json.expiresAt) : Date.now() + 10 * 60_000;
  cache[target.key] = { token: json.token, expiresAt };
  return json.token;
}

async function hardcodedToken(): Promise<string | undefined> {
  const c = cache.hardcoded;
  if (c && c.expiresAt > Date.now()) return c.token;
  try {
    const res = await fetch(`${HARDCODED_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (!res.ok) return undefined;
    const json = (await res.json()) as { token?: string };
    if (!json.token) return undefined;
    cache.hardcoded = { token: json.token, expiresAt: Date.now() + 30 * 60_000 };
    return json.token;
  } catch {
    return undefined;
  }
}

export type DashMode = 'live' | 'hardcoded' | 'remote';

/** Forwards one browser request to the Dashboard embed API of the chosen mode. */
export async function proxyDash(mode: DashMode, req: Request, path: string[]): Promise<Response> {
  const search = new URL(req.url).search;
  const sub = path.map(encodeURIComponent).join('/');
  const target =
    mode === 'hardcoded'
      ? `${HARDCODED_BASE}/hardcoded/api/v1/embed/${sub}${search}`
      : `${TARGETS[mode].base}/api/v1/embed/${sub}${search}`;

  const headers: Record<string, string> = { Accept: req.headers.get('accept') ?? 'application/json' };
  if (mode !== 'hardcoded' && process.env.DASH_PARAMETERS) headers['X-Dashboard-Parameters'] = process.env.DASH_PARAMETERS;
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  try {
    const token = mode === 'hardcoded' ? await hardcodedToken() : await dashboardToken(TARGETS[mode]);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: 'no-store',
    });
  } catch (e) {
    return Response.json({ error: `Upstream unreachable: ${target}`, detail: String(e) }, { status: 502 });
  }
  if (upstream.status === 401 && mode !== 'hardcoded') cache[mode] = undefined;

  const out = new Headers();
  for (const h of ['content-type', 'content-disposition']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  const body = upstream.status === 204 || upstream.status === 304 ? null : upstream.body;
  return new Response(body, { status: upstream.status, headers: out });
}
