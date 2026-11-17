import { OSOS_SYNCFUSION_LICENSE } from './osos.license';

export type EntityKey = 'dashboards' | 'datasets' | 'filters' | 'hierarchies' | 'data-sources' | 'access';
export type RowAction = 'view' | 'design' | 'edit' | 'delete';

export interface ListColumn {
  key: string;
  label: string;
}

export interface EntityConfig {
  title: string;
  listPath: string;
  deletePath: (id: string) => string;
  columns: ListColumn[];
  rowActions: RowAction[];
}

export const OSOS_BUNDLE = {
  base: '/osos-dashboard',
  script: 'main.js',
  styles: 'styles.css',
  probeTag: 'osos-dashboard-viewer',
  globalName: 'OsosDashboardElements',
  syncfusionLicense: OSOS_SYNCFUSION_LICENSE
};

export const OSOS_API = {
  loginPath: '/api/auth/login',
  embedPrefix: '/sis/api/v1/embed',
  requestEvent: 'osos-request',
  pageQuery: function (pageIndex: number, pageSize: number): string {
    return '$top=' + pageSize + '&$skip=' + pageIndex * pageSize + '&$count=true';
  }
};

const HIERARCHIES = '/dashboard/semantic/hierarchies';

export const OSOS_ENTITIES: { [key: string]: EntityConfig } = {
  dashboards: {
    title: 'Dashboards',
    listPath: '/dashboard/all',
    deletePath: function (id) { return '/dashboard/' + id; },
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'moduleCode', label: 'Module' },
      { key: 'widgetCount', label: 'Widgets' },
      { key: 'currentVersion', label: 'Version' }
    ],
    rowActions: ['view', 'design', 'delete']
  },
  datasets: {
    title: 'Datasets',
    listPath: '/dashboard-datasets',
    deletePath: function (id) { return '/dashboard-datasets/' + id; },
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'moduleScope', label: 'Module' },
      { key: 'fieldsCount', label: 'Fields' }
    ],
    rowActions: ['edit', 'delete']
  },
  filters: {
    title: 'Filters',
    listPath: '/dashboard-filters',
    deletePath: function (id) { return '/dashboard-filters/' + id; },
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'displayName', label: 'Display name' },
      { key: 'moduleScope', label: 'Module' }
    ],
    rowActions: ['edit', 'delete']
  },
  hierarchies: {
    title: 'Hierarchies',
    listPath: HIERARCHIES,
    deletePath: function (id) { return HIERARCHIES + '/' + id; },
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'hierarchyName', label: 'Name' },
      { key: 'module', label: 'Module' },
      { key: 'isActive', label: 'Active' }
    ],
    rowActions: ['edit', 'delete']
  }
};

export const OSOS_NAV: { key: EntityKey; label: string; link: string[] }[] = [
  { key: 'dashboards', label: 'Dashboards', link: ['/', 'dashboards'] },
  { key: 'datasets', label: 'Datasets', link: ['/', 'datasets'] },
  { key: 'filters', label: 'Filters', link: ['/', 'filters'] },
  { key: 'hierarchies', label: 'Hierarchies', link: ['/', 'hierarchies'] },
  { key: 'data-sources', label: 'Data sources', link: ['/', 'data-sources', 'page'] },
  { key: 'access', label: 'Access', link: ['/', 'access', 'page'] }
];
