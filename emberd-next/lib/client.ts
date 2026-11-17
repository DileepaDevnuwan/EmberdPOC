/* eslint-disable @typescript-eslint/no-explicit-any */
export type Mode = 'live' | 'hardcoded' | 'remote' | 'remote-npm';

export const MODES: readonly Mode[] = ['live', 'hardcoded', 'remote', 'remote-npm'];

export const apiMode = (mode: Mode) => (mode === 'remote-npm' ? 'remote' : mode);

export const bundleBase = (mode: Mode) => (mode === 'remote-npm' ? '/osos-npm' : '/osos-dashboard');

export const MENUS = [
  { slug: 'insight-hub', label: 'Insight Hub' },
  { slug: 'dashboards', label: 'Dashboards' },
  { slug: 'datasets', label: 'Datasets' },
  { slug: 'filters', label: 'Filters' },
  { slug: 'hierarchies', label: 'Hierarchies' },
  { slug: 'access', label: 'Access' },
] as const;

/** The bundle's helper global (`mode`, `blank`, `fromApi`). */
export const OE = (): any => (globalThis as any).OsosDashboardElements;

/** Calls this app's back end, which forwards to the Dashboard API of the given mode. */
export async function api<T = any>(mode: Mode, path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/api/dash/${apiMode(mode)}${path.startsWith('/') ? path : '/' + path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text().catch(() => '')}`);
  const text = await res.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export function pageQuery(pageIndex: number, pageSize: number): string {
  return `$top=${pageSize}&$skip=${pageIndex * pageSize}&$count=true`;
}

/** `TableAction` values of `handleUserEvents`. */
export const TableAction = { Delete: 0, View: 1, Edit: 2 } as const;

export const isEmptyId = (id?: string) => !id || id === '00000000-0000-0000-0000-000000000000';

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

export function answerConnector(mode: Mode, detail: any): void {
  const { method, args = [] } = detail?.args ?? {};
  if (typeof detail?.reply !== 'function') return;
  if (method === 'listPrincipals') return detail.reply(Promise.resolve({ users: [], roles: [] }));
  const call = CONNECTOR_CALLS[method];
  if (!call) return detail.reply(Promise.reject(new Error(`Unknown connector call ${method}`)));
  const [httpMethod, path, body] = call(...args);
  detail.reply(api(mode, path, httpMethod, body));
}
