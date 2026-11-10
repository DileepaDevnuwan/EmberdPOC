'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { OsosElement } from '@/components/OsosElement';
import { api, OE, type Mode } from '@/lib/client';

/** This product's own roles and users (the Dashboard never stores them; it only stores grants). */
const PRINCIPALS = [
  { id: 'Admin', name: 'Admin', type: 'Role', meta: 'Full access' },
  { id: 'SalesManager', name: 'Sales Manager', type: 'Role', meta: 'Sales team' },
  { id: 'HREmployee', name: 'HR Employee', type: 'Role', meta: 'HR team' },
  { id: 'u-1001', name: 'Alice Perera', type: 'User', meta: 'alice@next.demo' },
  { id: 'u-1002', name: 'Bilal Khan', type: 'User', meta: 'bilal@next.demo' },
];

const accessPath = (type: string, id: string) => `/dashboard-access/${type}/${encodeURIComponent(id)}`;

/** Role / user access: the element asks, the page answers through the host back end. */
export function AccessMenu({ mode }: { mode: Mode }) {
  const [access, setAccess] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<any>();

  const loadAccess = async (p: any) => {
    setSelected(p);
    setLoading(true);
    setError(undefined);
    try {
      setAccess(await api(mode, accessPath(p.type, p.id)));
    } catch (e) {
      setError(String(e));
      setAccess({ dashboards: [], datasets: [] });
    } finally {
      setLoading(false);
    }
  };

  const optionsPage = (path: string) => (detail: any) => {
    const { skip = 0, take = 20 } = detail?.args ?? {};
    detail?.reply?.(
      api(mode, `${path}?$top=${take}&$skip=${skip}&$count=true`).then(page => {
        const items = page?.items ?? [];
        return {
          items: items.map((i: any) => ({ id: i.id, name: i.name })),
          hasMore: items.length > 0 && skip + items.length < (page?.count ?? 0),
        };
      })
    );
  };

  const props = useMemo(() => ({ principals: PRINCIPALS, access, loading }), [access, loading]);
  const events = {
    principalSelected: (p: any) => void loadAccess(p),
    save: async (e: any) => {
      try {
        await api(mode, accessPath(e.principal.type, e.principal.id), 'PUT', e.request);
        await loadAccess(e.principal);
      } catch (err) {
        setError(String(err));
      }
    },
    dashboardOptionsRequest: optionsPage('/dashboard/all'),
    datasetOptionsRequest: optionsPage('/dashboard-datasets'),
    datasetFieldsRequest: (detail: any) =>
      detail?.reply?.(
        api(mode, `/dashboard-datasets/${detail.args}`).then(json => OE().fromApi.dataset(json).fields ?? [])
      ),
  };

  return (
    <section>
      <header className="page-head">
        <h1>Access</h1>
        <span className="muted">{selected ? `${selected.type}: ${selected.name}` : 'Pick a role or user'}</span>
      </header>
      {error && <pre className="error">{error}</pre>}
      <OsosElement tag="osos-access" props={props} events={events} />
    </section>
  );
}
