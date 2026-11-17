import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, effect, input, signal, viewChild } from '@angular/core';
import { answerConnectorRequest, isEmptyId, OE, pageQuery, remoteApi, TableAction } from './remote-bundle.api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const HOST_STYLES = `
  .page-head { display:flex; align-items:center; gap:12px; background:#fff; border-radius:8px; padding:12px 16px; margin-bottom:12px; }
  .page-head h2 { margin:0; font-size:18px; color:#1a1a2e; flex:1; }
  .page-head button { background:#0f3460; color:#fff; border:none; padding:6px 14px; border-radius:4px; cursor:pointer; }
  .muted { color:#777; font-size:13px; }
  .error { background:#fde8ea; color:#a1182c; padding:8px 12px; border-radius:6px; white-space:pre-wrap; }
`;

@Component({
  selector: 'app-bundle-insight-hub',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="page-head">
      <h2>Insight Hub</h2>
      <span class="muted">{{ loading() ? 'Loading...' : dashboards().length + ' dashboard(s)' }}</span>
    </header>
    @if (error()) { <pre class="error">{{ error() }}</pre> }
    <osos-insight-hub [dashboards]="dashboards()" [loading]="loading()"></osos-insight-hub>
  `,
  styles: [HOST_STYLES],
})
export class BundleInsightHubComponent {
  readonly dashboards = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | undefined>(undefined);

  constructor() {
    remoteApi('/dashboard/hub?moduleCode=GLOBAL&$top=200&$skip=0')
      .then(res => this.dashboards.set(Array.isArray(res) ? res : (res?.items ?? [])))
      .catch(e => this.error.set(String(e)))
      .finally(() => this.loading.set(false));
  }
}

type DashboardView =
  | { kind: 'list' }
  | { kind: 'viewer'; id: string }
  | { kind: 'builder'; id?: string; dashboardMode: 'create' | 'update' | 'view' };

@Component({
  selector: 'app-bundle-dashboards',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="page-head">
      <h2>Dashboards</h2>
      @switch (view().kind) {
        @case ('list') { <button (click)="add()">Add dashboard</button> }
        @case ('viewer') {
          <button (click)="edit()">Edit</button>
          <button (click)="toList()">Back to list</button>
        }
        @case ('builder') { <button (click)="toList()">Back to list</button> }
      }
    </header>
    @if (error()) { <pre class="error">{{ error() }}</pre> }
    @switch (view().kind) {
      @case ('list') {
        <osos-dashboard-list #list
          [dashboards]="rows()" [count]="count()"
          (pageChanges)="onPage($any($event).detail)"
          (handleUserEvents)="onUserEvent($any($event).detail)"
          (created)="openBuilder($any($event).detail, 'update')"></osos-dashboard-list>
      }
      @default {
        <div #elementHost></div>
      }
    }
  `,
  styles: [HOST_STYLES],
})
export class BundleDashboardsComponent {
  readonly view = signal<DashboardView>({ kind: 'list' });
  readonly rows = signal<any[]>([]);
  readonly count = signal(0);
  readonly page = signal({ pageIndex: 0, pageSize: 10 });
  readonly error = signal<string | undefined>(undefined);
  readonly list = viewChild<ElementRef<any>>('list');
  readonly elementHost = viewChild<ElementRef<HTMLElement>>('elementHost');

  constructor() {
    effect(() => {
      if (this.view().kind === 'list') void this.load(this.page());
    });
    effect(() => {
      const host = this.elementHost()?.nativeElement;
      const view = this.view();
      if (host && view.kind !== 'list') this.#mount(host, view);
    });
  }

  #mount(host: HTMLElement, view: Exclude<DashboardView, { kind: 'list' }>): void {
    host.replaceChildren();
    if (view.kind === 'viewer') {
      const viewer: any = document.createElement('osos-dashboard-viewer');
      Object.assign(viewer, { dashboardId: view.id, embedded: true });
      host.appendChild(viewer);
      return;
    }
    const builder: any = document.createElement('osos-dashboard-builder');
    Object.assign(builder, { dashboardId: view.id, dashboardMode: OE().mode[view.dashboardMode] });
    builder.addEventListener('closed', () => this.toList());
    builder.addEventListener('previewRequested', (event: Event) =>
      this.view.set({ kind: 'viewer', id: (event as CustomEvent).detail }));
    builder.addEventListener('cloned', (event: Event) =>
      this.openBuilder((event as CustomEvent).detail, 'update'));
    host.appendChild(builder);
  }

  viewerId(): string | undefined {
    const v = this.view();
    return v.kind === 'viewer' ? v.id : undefined;
  }

  builderId(): string | undefined {
    const v = this.view();
    return v.kind === 'builder' ? v.id : undefined;
  }

  builderMode(): number | undefined {
    const v = this.view();
    return v.kind === 'builder' ? OE().mode[v.dashboardMode] : undefined;
  }

  async load(page: { pageIndex: number; pageSize: number }): Promise<void> {
    try {
      this.error.set(undefined);
      const res = await remoteApi(`/dashboard/all?${pageQuery(page.pageIndex, page.pageSize)}`);
      const items = res?.items ?? [];
      this.rows.set(items);
      this.count.set(res?.count ?? items.length);
    } catch (e) {
      this.error.set(String(e));
    }
  }

  onPage(e: any): void {
    this.page.set({ pageIndex: e?.pageIndex ?? 0, pageSize: e?.pageSize ?? 10 });
  }

  async onUserEvent(e: any): Promise<void> {
    if (e?.type === TableAction.View) this.view.set({ kind: 'viewer', id: e.id });
    else if (e?.type === TableAction.Edit) this.openBuilder(e.id, 'update');
    else if (e?.type === TableAction.Delete && confirm('Delete this dashboard?')) {
      await remoteApi(`/dashboard/${e.id}`, 'DELETE').catch(err => this.error.set(String(err)));
      void this.load(this.page());
    }
  }

  openBuilder(id: string | undefined, dashboardMode: 'create' | 'update' | 'view'): void {
    this.view.set({ kind: 'builder', id, dashboardMode });
  }

  async add(): Promise<void> {
    const el = this.list()?.nativeElement;
    if (el && typeof el.openAddDialog === 'function') {
      el.openAddDialog();
      return;
    }
    const name = prompt('Dashboard name', 'New dashboard');
    if (!name?.trim()) return;
    try {
      const id = await remoteApi<string>('/dashboard', 'POST', {
        code: `DB_${Date.now()}`,
        name: name.trim(),
        description: null,
        moduleCode: 'SALES',
        isShared: false,
        isDefault: false,
        tags: null,
        status: 0,
      });
      this.openBuilder(id, 'update');
    } catch (e) {
      this.error.set(String(e));
    }
  }

  edit(): void {
    const id = this.viewerId();
    if (id) this.openBuilder(id, 'update');
  }

  toList(): void {
    this.view.set({ kind: 'list' });
  }
}

export type BundleCrudConfig = {
  title: string;
  listTag: 'osos-dataset-list' | 'osos-filter-list' | 'osos-hierarchy-list';
  listPath: string;
  formProp: 'dataset' | 'filter' | 'hierarchy';
  detailPath: (id: string) => string;
  mapRow?: (raw: any) => any;
  formExtras: () => Promise<Record<string, unknown>>;
  formRequests?: Record<string, (detail: any, form: any) => void>;
};

const HIERARCHIES = '/dashboard/semantic/hierarchies';

async function datasetOptions(): Promise<any[]> {
  const res = await remoteApi('/dashboard-datasets?$top=0');
  return res?.items ?? [];
}

const sourceDatasets = async () => ({
  sourceDatasets: (await datasetOptions()).map(d => ({ id: d.id, name: d.name, code: d.code })),
});

const dropdownOptionsPath = (datasetId: string, args: any) => {
  const { valueField, labelField, skip = 0, take = 20 } = args ?? {};
  const query = [`skip=${skip}`, `take=${take}`];
  if (valueField) query.push(`valueField=${encodeURIComponent(valueField)}`);
  if (labelField) query.push(`labelField=${encodeURIComponent(labelField)}`);
  return `/dashboard-datasets/${datasetId}/dropdown-options?${query.join('&')}`;
};

const logRequest = (name: string) => (detail: any) => console.info(`[host] ${name} (not handled in this demo)`, detail?.args);

export const BUNDLE_CRUD: Record<string, BundleCrudConfig> = {
  datasets: {
    title: 'Datasets',
    listTag: 'osos-dataset-list',
    listPath: '/dashboard-datasets',
    formProp: 'dataset',
    detailPath: id => `/dashboard-datasets/${id}`,
    formExtras: sourceDatasets,
    formRequests: { connectorRequest: answerConnectorRequest },
  },
  filters: {
    title: 'Filters',
    listTag: 'osos-filter-list',
    listPath: '/dashboard-filters',
    formProp: 'filter',
    detailPath: id => `/dashboard-filters/${id}`,
    mapRow: raw => ({ ...raw, ...OE().fromApi.filter(raw) }),
    formExtras: async () => ({ datasets: await datasetOptions() }),
    formRequests: {
      loadPreview: (detail: any, form: any) => {
        if (!detail?.datasetId) return;
        void remoteApi(`/dashboard-datasets/${detail.datasetId}`).then(json => (form.datasetFields = OE().fromApi.dataset(json).fields ?? []));
      },
      previewPageRequest: (detail: any) => {
        const { datasetId, ...args } = detail?.args ?? {};
        detail?.reply?.(datasetId ? remoteApi(dropdownOptionsPath(datasetId, args)) : Promise.resolve({ items: [], hasMore: false }));
      },
    },
  },
  hierarchies: {
    title: 'Hierarchies',
    listTag: 'osos-hierarchy-list',
    listPath: HIERARCHIES,
    formProp: 'hierarchy',
    detailPath: id => `${HIERARCHIES}/${id}`,
    mapRow: raw => ({ ...raw, ...OE().fromApi.hierarchy(raw) }),
    formExtras: sourceDatasets,
    formRequests: {
      validateReference: (detail: any) => {
        const { datasetId, hierarchyId } = detail?.args ?? {};
        if (!detail?.reply) return;
        if (!datasetId || !hierarchyId) return detail.reply({ valid: true });
        detail.reply(
          remoteApi(`/dashboard/semantic/dashboard-datasets/${datasetId}/validate/${hierarchyId}`).then(r => ({
            valid: !!r?.isValid,
            message: (r?.issues ?? []).map((i: any) => i.message).join(' ') || undefined,
          }))
        );
      },
    },
  },
};

type CrudView = { kind: 'list' } | { kind: 'form'; record: any; formMode: number; isNew: boolean };

@Component({
  selector: 'app-bundle-crud',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="page-head">
      <h2>{{ config().title }}</h2>
      @if (view().kind === 'list') {
        <button (click)="add()">Add</button>
      } @else {
        <button (click)="toList()">Back to list</button>
      }
    </header>
    @if (error()) { <pre class="error">{{ error() }}</pre> }
    @if (view().kind === 'list') {
      @switch (config().listTag) {
        @case ('osos-dataset-list') {
          <osos-dataset-list [datasets]="rows()" [count]="count()"
            (pageChanges)="onPage($any($event).detail)"
            (handleUserEvents)="onUserEvent($any($event).detail)"></osos-dataset-list>
        }
        @case ('osos-filter-list') {
          <osos-filter-list [filters]="rows()" [count]="count()"
            (pageChanges)="onPage($any($event).detail)"
            (handleUserEvents)="onUserEvent($any($event).detail)"></osos-filter-list>
        }
        @case ('osos-hierarchy-list') {
          <osos-hierarchy-list [hierarchies]="rows()" [count]="count()"
            (pageChanges)="onPage($any($event).detail)"
            (handleUserEvents)="onUserEvent($any($event).detail)"></osos-hierarchy-list>
        }
      }
    } @else {
      <div #formHost></div>
    }
  `,
  styles: [HOST_STYLES],
})
export class BundleCrudComponent {
  readonly config = input.required<BundleCrudConfig>();
  readonly view = signal<CrudView>({ kind: 'list' });
  readonly rows = signal<any[]>([]);
  readonly count = signal(0);
  readonly page = signal({ pageIndex: 0, pageSize: 10 });
  readonly error = signal<string | undefined>(undefined);
  readonly formHost = viewChild<ElementRef<HTMLElement>>('formHost');
  #extras: Record<string, unknown> = {};

  constructor() {
    effect(() => {
      if (this.view().kind === 'list') void this.load(this.config(), this.page());
    });
    effect(() => {
      void this.config().formExtras().then(x => (this.#extras = x)).catch(() => (this.#extras = {}));
    });
    effect(() => {
      const host = this.formHost()?.nativeElement;
      const v = this.view();
      if (host && v.kind === 'form') this.#mountForm(host, v);
    });
  }

  async load(config: BundleCrudConfig, page: { pageIndex: number; pageSize: number }): Promise<void> {
    try {
      this.error.set(undefined);
      const sep = config.listPath.includes('?') ? '&' : '?';
      const res = await remoteApi(`${config.listPath}${sep}${pageQuery(page.pageIndex, page.pageSize)}`);
      const items: any[] = Array.isArray(res) ? res : (res?.items ?? []);
      this.rows.set(config.mapRow ? items.map(config.mapRow) : items);
      this.count.set(Array.isArray(res) ? res.length : (res?.count ?? items.length));
    } catch (e) {
      this.error.set(String(e));
    }
  }

  onPage(e: any): void {
    this.page.set({ pageIndex: e?.pageIndex ?? 0, pageSize: e?.pageSize ?? 10 });
  }

  async onUserEvent(e: any): Promise<void> {
    const config = this.config();
    if (e?.type === TableAction.View) await this.open(e.id, OE().mode.view);
    else if (e?.type === TableAction.Edit) await this.open(e.id, OE().mode.update);
    else if (e?.type === TableAction.Delete && confirm('Delete this record?')) {
      await remoteApi(config.detailPath(e.id), 'DELETE').catch(err => this.error.set(String(err)));
      void this.load(config, this.page());
    }
  }

  async open(id: string, formMode: number): Promise<void> {
    try {
      const prop = this.config().formProp;
      const json = await remoteApi(this.config().detailPath(id));
      this.view.set({ kind: 'form', record: OE().fromApi[prop](json), formMode, isNew: false });
    } catch (e) {
      this.error.set(String(e));
    }
  }

  add(): void {
    const prop = this.config().formProp;
    this.view.set({ kind: 'form', record: OE().blank[prop](), formMode: OE().mode.create, isNew: true });
  }

  toList(): void {
    this.view.set({ kind: 'list' });
  }

  #mountForm(host: HTMLElement, v: Extract<CrudView, { kind: 'form' }>): void {
    const config = this.config();
    host.replaceChildren();
    const form: any = document.createElement(`osos-${config.formProp}-form`);
    Object.assign(form, { [config.formProp]: v.record, mode: v.formMode, ...this.#extras });
    form.addEventListener('save', async (event: Event) => {
      const model = (event as CustomEvent).detail;
      try {
        await OE().save[config.formProp](model, v.isNew || isEmptyId(model?.id));
        this.toList();
      } catch (e) {
        this.error.set(String(e));
      }
    });
    form.addEventListener('cancelled', () => this.toList());
    for (const [name, handler] of Object.entries(config.formRequests ?? {})) {
      form.addEventListener(name, (event: Event) => handler((event as CustomEvent).detail, form));
    }
    host.appendChild(form);
  }
}

const PRINCIPALS = [
  { id: 'Admin', name: 'Admin', type: 'Role', meta: 'Full access' },
  { id: 'SalesManager', name: 'Sales Manager', type: 'Role', meta: 'Sales team' },
  { id: 'HREmployee', name: 'HR Employee', type: 'Role', meta: 'HR team' },
  { id: 'u-1001', name: 'Alice Perera', type: 'User', meta: 'alice@emberd.demo' },
  { id: 'u-1002', name: 'Bilal Khan', type: 'User', meta: 'bilal@emberd.demo' },
];

const accessPath = (type: string, id: string) => `/dashboard-access/${type}/${encodeURIComponent(id)}`;

@Component({
  selector: 'app-bundle-access',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="page-head">
      <h2>Access</h2>
      <span class="muted">{{ selected() ? selected().type + ': ' + selected().name : 'Pick a role or user' }}</span>
    </header>
    @if (error()) { <pre class="error">{{ error() }}</pre> }
    <osos-access [principals]="principals" [access]="access()" [loading]="loading()"
      (principalSelected)="loadAccess($any($event).detail)"
      (save)="save($any($event).detail)"
      (dashboardOptionsRequest)="optionsPage('/dashboard/all', $any($event).detail)"
      (datasetOptionsRequest)="optionsPage('/dashboard-datasets', $any($event).detail)"
      (datasetFieldsRequest)="datasetFields($any($event).detail)"></osos-access>
  `,
  styles: [HOST_STYLES],
})
export class BundleAccessComponent {
  readonly principals = PRINCIPALS;
  readonly access = signal<any>(null);
  readonly loading = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly selected = signal<any>(undefined);

  async loadAccess(p: any): Promise<void> {
    this.selected.set(p);
    this.loading.set(true);
    this.error.set(undefined);
    try {
      this.access.set(await remoteApi(accessPath(p.type, p.id)));
    } catch (e) {
      this.error.set(String(e));
      this.access.set({ dashboards: [], datasets: [] });
    } finally {
      this.loading.set(false);
    }
  }

  async save(e: any): Promise<void> {
    try {
      await remoteApi(accessPath(e.principal.type, e.principal.id), 'PUT', e.request);
      await this.loadAccess(e.principal);
    } catch (err) {
      this.error.set(String(err));
    }
  }

  optionsPage(path: string, detail: any): void {
    const { skip = 0, take = 20 } = detail?.args ?? {};
    detail?.reply?.(
      remoteApi(`${path}?$top=${take}&$skip=${skip}&$count=true`).then(page => {
        const items = page?.items ?? [];
        return {
          items: items.map((i: any) => ({ id: i.id, name: i.name })),
          hasMore: items.length > 0 && skip + items.length < (page?.count ?? 0),
        };
      })
    );
  }

  datasetFields(detail: any): void {
    detail?.reply?.(remoteApi(`/dashboard-datasets/${detail.args}`).then(json => OE().fromApi.dataset(json).fields ?? []));
  }
}
