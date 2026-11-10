/* eslint-disable @typescript-eslint/no-explicit-any */
export type Mode = 'live' | 'hardcoded';

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
  const res = await fetch(`/api/dash/${mode}${path.startsWith('/') ? path : '/' + path}`, {
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
