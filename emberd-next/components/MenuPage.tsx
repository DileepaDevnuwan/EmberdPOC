'use client';
import { HostBridge } from '@/components/HostBridge';
import { AccessMenu } from '@/components/menus/AccessMenu';
import { CrudMenu } from '@/components/menus/CrudMenu';
import { DashboardsMenu } from '@/components/menus/DashboardsMenu';
import { InsightHubMenu } from '@/components/menus/InsightHubMenu';
import { datasetConfig, filterConfig, hierarchyConfig } from '@/components/menus/configs';
import type { Mode } from '@/lib/client';

/** One menu of one nav group; `key` remounts everything when the mode or menu changes. */
export function MenuPage({ mode, menu }: { mode: Mode; menu: string }) {
  const key = `${mode}-${menu}`;
  return (
    <>
      <HostBridge mode={mode} />
      {menu === 'insight-hub' && <InsightHubMenu key={key} mode={mode} />}
      {menu === 'dashboards' && <DashboardsMenu key={key} mode={mode} />}
      {menu === 'datasets' && <CrudMenu key={key} mode={mode} config={datasetConfig} />}
      {menu === 'filters' && <CrudMenu key={key} mode={mode} config={filterConfig} />}
      {menu === 'hierarchies' && <CrudMenu key={key} mode={mode} config={hierarchyConfig} />}
      {menu === 'access' && <AccessMenu key={key} mode={mode} />}
    </>
  );
}
