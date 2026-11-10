'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { OsosElement, useOsosReady } from '@/components/OsosElement';
import { api, type Mode } from '@/lib/client';

/** The insight hub shows one tab per published dashboard; it opens the viewer itself. */
export function InsightHubMenu({ mode }: { mode: Mode }) {
  const ready = useOsosReady();
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!ready) return;
    api(mode, '/dashboard/hub?moduleCode=GLOBAL&$top=200&$skip=0')
      .then(res => setDashboards(Array.isArray(res) ? res : (res?.items ?? [])))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [ready, mode]);

  const props = useMemo(() => ({ dashboards, loading }), [dashboards, loading]);
  return (
    <section>
      <header className="page-head">
        <h1>Insight Hub</h1>
        <span className="muted">{loading ? 'Loading...' : `${dashboards.length} dashboard(s)`}</span>
      </header>
      {error && <pre className="error">{error}</pre>}
      <OsosElement tag="osos-insight-hub" props={props} />
    </section>
  );
}
