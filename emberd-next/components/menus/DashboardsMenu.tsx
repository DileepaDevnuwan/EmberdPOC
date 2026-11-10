'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OsosElement, useOsosReady } from '@/components/OsosElement';
import { api, OE, pageQuery, TableAction, type Mode } from '@/lib/client';

type View =
  | { kind: 'list' }
  | { kind: 'viewer'; id: string }
  | { kind: 'builder'; id?: string; dashboardMode: 'create' | 'update' | 'view' };

/** Dashboard list -> viewer / builder, all three as Dashboard elements. */
export function DashboardsMenu({ mode }: { mode: Mode }) {
  const ready = useOsosReady();
  const [view, setView] = useState<View>({ kind: 'list' });
  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState({ pageIndex: 0, pageSize: 10 });
  const [error, setError] = useState<string>();
  const listEl = useRef<any>(null);

  const load = useCallback(async () => {
    try {
      setError(undefined);
      const res = await api(mode, `/dashboard/all?${pageQuery(page.pageIndex, page.pageSize)}`);
      const items = res?.items ?? [];
      setRows(items);
      setCount(res?.count ?? items.length);
      // Demo convenience: `?open=first` (or ?open=<id>) shows a dashboard in the viewer.
      const open = new URLSearchParams(location.search).get('open');
      if (open) setView({ kind: 'viewer', id: open === 'first' ? items[0]?.id : open });
    } catch (e) {
      setError(String(e));
    }
  }, [mode, page]);

  useEffect(() => {
    if (ready && view.kind === 'list') void load();
  }, [ready, view.kind, load]);

  const listProps = useMemo(() => ({ dashboards: rows, count }), [rows, count]);
  const listEvents = {
    pageChanges: (e: any) => setPage({ pageIndex: e?.pageIndex ?? 0, pageSize: e?.pageSize ?? 10 }),
    handleUserEvents: async (e: any) => {
      if (e?.type === TableAction.View) setView({ kind: 'viewer', id: e.id });
      else if (e?.type === TableAction.Edit) setView({ kind: 'builder', id: e.id, dashboardMode: 'update' });
      else if (e?.type === TableAction.Delete && confirm('Delete this dashboard?')) {
        await api(mode, `/dashboard/${e.id}`, 'DELETE').catch(err => setError(String(err)));
        void load();
      } else console.info('[host] dashboard list event', e);
    },
    created: (id: string) => setView({ kind: 'builder', id, dashboardMode: 'update' }),
  };

  const add = () => {
    const el = listEl.current;
    if (el && typeof el.openAddDialog === 'function') el.openAddDialog();
    else setView({ kind: 'builder', dashboardMode: 'create' });
  };

  const viewerProps = useMemo(
    () => (view.kind === 'viewer' ? { dashboardId: view.id, embedded: true } : {}),
    [view]
  );
  const builderProps = useMemo(
    () =>
      view.kind === 'builder' && ready
        ? { dashboardId: view.id, dashboardMode: OE().mode[view.dashboardMode] }
        : {},
    [view, ready]
  );
  const builderEvents = {
    closed: () => setView({ kind: 'list' }),
    previewRequested: (id: string) => setView({ kind: 'viewer', id }),
    cloned: (id: string) => setView({ kind: 'builder', id, dashboardMode: 'update' }),
  };

  if (!ready) return <p className="muted">Loading Dashboard bundle...</p>;
  return (
    <section>
      <header className="page-head">
        <h1>Dashboards</h1>
        {view.kind === 'list' && <button onClick={add}>Add dashboard</button>}
        {view.kind === 'viewer' && (
          <>
            <button onClick={() => setView({ kind: 'builder', id: view.id, dashboardMode: 'update' })}>Edit</button>
            <button onClick={() => setView({ kind: 'list' })}>Back to list</button>
          </>
        )}
        {view.kind === 'builder' && <button onClick={() => setView({ kind: 'list' })}>Back to list</button>}
      </header>
      {error && <pre className="error">{error}</pre>}
      {view.kind === 'list' && (
        <OsosElement
          key="list"
          tag="osos-dashboard-list"
          props={listProps}
          events={listEvents}
          onElement={el => (listEl.current = el)}
        />
      )}
      {view.kind === 'viewer' && (
        <OsosElement key={`viewer-${view.id}`} tag="osos-dashboard-viewer" props={viewerProps} />
      )}
      {view.kind === 'builder' && (
        <OsosElement
          key={`builder-${view.id ?? 'new'}`}
          tag="osos-dashboard-builder"
          props={builderProps}
          events={builderEvents}
        />
      )}
    </section>
  );
}
