import { REMOTE_BASE_URL } from '../../core/hardcoded/hardcoded.providers';
import { environment } from '../../../environments/environment';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BUNDLE_URL = '/osos-dashboard';
const PROBE_TAG = 'osos-dashboard-viewer';
const EMBED_BASE = `${REMOTE_BASE_URL}/api/v1/embed`;

let bundleLoad: Promise<void> | undefined;

export const OE = (): any => (globalThis as any).OsosDashboardElements;

export const TableAction = { Delete: 0, View: 1, Edit: 2 } as const;

export const isEmptyId = (id?: string) => !id || id === '00000000-0000-0000-0000-000000000000';

export function pageQuery(pageIndex: number, pageSize: number): string {
  return `$top=${pageSize}&$skip=${pageIndex * pageSize}&$count=true`;
}

export function loadOsosBundle(): Promise<void> {
  bundleLoad ??= new Promise<void>(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${BUNDLE_URL}/styles.css`;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.type = 'module';
    script.src = `${BUNDLE_URL}/main.js`;
    document.head.appendChild(script);

    customElements.whenDefined(PROBE_TAG).then(() => {
      const api = OE();
      if (environment.syncfusionLicense && api?.registerSyncfusionLicense) {
        api.registerSyncfusionLicense(environment.syncfusionLicense);
      }
      resolve();
    });
  });
  return bundleLoad;
}

function authHeaders(json: boolean): Record<string, string> {
  const headers: Record<string, string> = { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function remoteApi<T = any>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${EMBED_BASE}${path.startsWith('/') ? path : '/' + path}`, {
    method,
    headers: authHeaders(body !== undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text().catch(() => '')}`);
  const text = await res.text();
  return (text ? safeJson(text) : null) as T;
}

export function startHostBridge(): () => void {
  const onRequest = (event: Event) => {
    const { call, method = 'GET', path, body, reply } = (event as CustomEvent).detail ?? {};
    if (!path || typeof reply !== 'function') return;
    const isDownload = typeof call === 'string' && call.endsWith('.download');
    const hasBody = body !== undefined && body !== null && method !== 'GET';
    reply(
      fetch(`${EMBED_BASE}${path}`, {
        method,
        headers: authHeaders(hasBody),
        body: hasBody ? JSON.stringify(body) : undefined,
      }).then(async res => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.warn(`[host] ${call} ${method} ${path} -> ${res.status}`, text.slice(0, 300));
          throw { status: res.status, error: safeJson(text) };
        }
        if (isDownload) return res;
        const text = await res.text();
        return text ? safeJson(text) : null;
      })
    );
  };
  document.addEventListener('osos-request', onRequest);
  return () => document.removeEventListener('osos-request', onRequest);
}

const DATA_SOURCES = '/data-sources';
const QUERIES = '/data-source-queries';

const CONNECTOR_CALLS: Record<string, (...args: any[]) => [string, string, unknown?]> = {
  getTypes: () => ['GET', `${DATA_SOURCES}/types`],
  getAll: () => ['GET', DATA_SOURCES],
  getById: id => ['GET', `${DATA_SOURCES}/${id}`],
  create: request => ['POST', DATA_SOURCES, request],
  update: (id, request) => ['PUT', `${DATA_SOURCES}/${id}`, request],
  delete: id => ['DELETE', `${DATA_SOURCES}/${id}`],
  test: request => ['POST', `${DATA_SOURCES}/test`, request],
  testSaved: id => ['POST', `${DATA_SOURCES}/${id}/test`, {}],
  getObjects: id => ['GET', `${DATA_SOURCES}/${id}/objects`],
  getColumns: (id, object) => ['GET', `${DATA_SOURCES}/${id}/columns?schema=${encodeURIComponent(object?.schema ?? '')}&name=${encodeURIComponent(object?.name ?? '')}`],
  getRelationships: id => ['GET', `${DATA_SOURCES}/${id}/relationships`],
  previewObject: (id, object) => ['POST', `${DATA_SOURCES}/${id}/preview`, object],
  getPermissions: id => ['GET', `${DATA_SOURCES}/${id}/permissions`],
  savePermissions: (id, permissions) => ['PUT', `${DATA_SOURCES}/${id}/permissions`, permissions],
  renderDesign: (id, design) => ['POST', `${QUERIES}/${id}/design/render`, { design }],
  validateFormula: (id, request) => ['POST', `${QUERIES}/${id}/design/validate-formula`, request],
  previewQuery: (id, request) => ['POST', `${QUERIES}/${id}/preview`, request],
  describeQuery: (id, request) => ['POST', `${QUERIES}/${id}/describe`, request],
};

export function answerConnectorRequest(detail: any): void {
  const { method, args = [] } = detail?.args ?? {};
  if (typeof detail?.reply !== 'function') return;
  if (method === 'listPrincipals') {
    detail.reply(Promise.resolve({ users: [], roles: [] }));
    return;
  }
  const call = CONNECTOR_CALLS[method];
  if (!call) {
    detail.reply(Promise.reject(new Error(`Unknown connector call ${method}`)));
    return;
  }
  const [httpMethod, path, body] = call(...args);
  detail.reply(remoteApi(path, httpMethod, body));
}
