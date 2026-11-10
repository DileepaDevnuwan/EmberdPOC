'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { OsosElement, useOsosReady } from '@/components/OsosElement';
import { api, OE, pageQuery, TableAction, type Mode } from '@/lib/client';

export type CrudConfig = {
  title: string;
  listTag: string;
  /** List element property that takes the rows. */
  listProp: string;
  listPath: string;
  formTag: string;
  /** Form element property that takes the record. */
  formProp: 'dataset' | 'filter' | 'hierarchy';
  detailPath: (id: string) => string;
  deletePath: (id: string) => string;
  /** Maps one API list item to the list element's row model. */
  mapRow?: (raw: any) => any;
  save: (mode: Mode, model: any, isNew: boolean) => Promise<unknown>;
  /** Extra form properties loaded once (e.g. datasets for the filter form). */
  formExtras?: (mode: Mode) => Promise<Record<string, unknown>>;
  /** Handlers for the form's `{ args, reply }` request outputs. */
  formRequests?: (mode: Mode) => Record<string, (detail: any) => void>;
};

type View = { kind: 'list' } | { kind: 'form'; record: any; formMode: number; isNew: boolean };

/** A list element plus its form element, all data through the host back end. */
export function CrudMenu({ mode, config }: { mode: Mode; config: CrudConfig }) {
  const ready = useOsosReady();
  const [view, setView] = useState<View>({ kind: 'list' });
  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState({ pageIndex: 0, pageSize: 10 });
  const [error, setError] = useState<string>();
  const [extras, setExtras] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    try {
      setError(undefined);
      const sep = config.listPath.includes('?') ? '&' : '?';
      const res = await api(mode, `${config.listPath}${sep}${pageQuery(page.pageIndex, page.pageSize)}`);
      const items = Array.isArray(res) ? res : (res?.items ?? []);
      setRows(config.mapRow ? items.map(config.mapRow) : items);
      setCount(Array.isArray(res) ? res.length : (res?.count ?? items.length));
    } catch (e) {
      setError(String(e));
    }
  }, [mode, config, page]);

  useEffect(() => {
    if (ready && view.kind === 'list') void load();
  }, [ready, view.kind, load]);

  useEffect(() => {
    if (ready && config.formExtras) config.formExtras(mode).then(setExtras).catch(() => setExtras({}));
  }, [ready, mode, config]);

  const open = async (id: string, formMode: number) => {
    try {
      const json = await api(mode, config.detailPath(id));
      setView({ kind: 'form', record: OE().fromApi[config.formProp](json), formMode, isNew: false });
    } catch (e) {
      setError(String(e));
    }
  };

  const listProps = useMemo(() => ({ [config.listProp]: rows, count }), [config.listProp, rows, count]);
  const listEvents = {
    pageChanges: (e: any) => setPage({ pageIndex: e?.pageIndex ?? 0, pageSize: e?.pageSize ?? 10 }),
    handleUserEvents: async (e: any) => {
      if (e?.type === TableAction.View) await open(e.id, OE().mode.view);
      else if (e?.type === TableAction.Edit) await open(e.id, OE().mode.update);
      else if (e?.type === TableAction.Delete && confirm('Delete this record?')) {
        await api(mode, config.deletePath(e.id), 'DELETE').catch(err => setError(String(err)));
        void load();
      } else console.info('[host] list event', e);
    },
  };

  const formProps = useMemo(
    () =>
      view.kind === 'form' ? { [config.formProp]: view.record, mode: view.formMode, ...extras } : {},
    [view, config.formProp, extras]
  );
  const formEvents = {
    save: async (model: any) => {
      try {
        await config.save(mode, model, view.kind === 'form' && view.isNew);
        setView({ kind: 'list' });
      } catch (e) {
        setError(String(e));
      }
    },
    cancelled: () => setView({ kind: 'list' }),
    ...(config.formRequests?.(mode) ?? {}),
  };

  if (!ready) return <p className="muted">Loading Dashboard bundle...</p>;
  return (
    <section>
      <header className="page-head">
        <h1>{config.title}</h1>
        {view.kind === 'list' ? (
          <button
            onClick={() =>
              setView({ kind: 'form', record: OE().blank[config.formProp](), formMode: OE().mode.create, isNew: true })
            }>
            Add
          </button>
        ) : (
          <button onClick={() => setView({ kind: 'list' })}>Back to list</button>
        )}
      </header>
      {error && <pre className="error">{error}</pre>}
      {view.kind === 'list' ? (
        <OsosElement key="list" tag={config.listTag} props={listProps} events={listEvents} />
      ) : (
        <OsosElement key="form" tag={config.formTag} props={formProps} events={formEvents} />
      )}
    </section>
  );
}
