import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { EmbedApiService } from './embed-api.service';
import { EntityConfig, OSOS_API, OSOS_ENTITIES, RowAction } from './osos.config';
import { AuthService } from './auth.service';

const ACTION_LABELS: { [action: string]: string } = { view: 'View', design: 'Design', edit: 'Edit', delete: 'Delete' };

@Component({
  selector: 'app-entity-list',
  template: `
    <section *ngIf="config">
      <header class="page-head">
        <h1>{{ config.title }}</h1>
        <button class="primary" (click)="create()">New</button>
      </header>
      <p class="error" *ngIf="error">{{ error }}</p>
      <table class="grid">
        <thead>
          <tr>
            <th *ngFor="let c of config.columns">{{ c.label }}</th>
            <th class="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="loading"><td [attr.colspan]="config.columns.length + 1" class="muted">Loading...</td></tr>
          <tr *ngIf="!loading && rows.length === 0"><td [attr.colspan]="config.columns.length + 1" class="muted">No records</td></tr>
          <tr *ngFor="let row of rows">
            <td *ngFor="let c of config.columns">{{ cell(row, c.key) }}</td>
            <td class="actions">
              <button *ngFor="let a of config.rowActions" class="small" (click)="open(a, row.id)">{{ label(a) }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <footer class="pager">
        <span>{{ total }} records</span>
        <span class="spacer"></span>
        <label>Page size
          <select [ngModel]="pageSize" (ngModelChange)="setPageSize($event)">
            <option *ngFor="let s of pageSizes" [ngValue]="s">{{ s }}</option>
          </select>
        </label>
        <button class="small" [disabled]="pageIndex === 0" (click)="goPage(pageIndex - 1)">Prev</button>
        <span>Page {{ pageIndex + 1 }} of {{ pageCount }}</span>
        <button class="small" [disabled]="pageIndex + 1 >= pageCount" (click)="goPage(pageIndex + 1)">Next</button>
      </footer>
    </section>
    <p class="error" *ngIf="!config">Unknown menu</p>
  `
})
export class EntityListComponent implements OnInit, OnDestroy {
  entity = '';
  config: EntityConfig | null = null;
  rows: any[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  pageSizes = [5, 10, 20, 50];
  loading = false;
  error = '';
  private sub: { unsubscribe(): void } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: EmbedApiService,
    private auth: AuthService
  ) {}

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params: ParamMap) => {
      this.entity = params.get('entity') || '';
      this.config = OSOS_ENTITIES[this.entity] || null;
      this.pageIndex = 0;
      this.load();
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  label(action: string): string {
    return ACTION_LABELS[action] || action;
  }

  cell(row: any, key: string): string {
    const v = row ? row[key] : null;
    if (v === null || v === undefined) {
      return '';
    }
    if (typeof v === 'boolean') {
      return v ? 'Yes' : 'No';
    }
    return String(v);
  }

  load(): void {
    if (!this.config) {
      return;
    }
    const cfg = this.config;
    const sep = cfg.listPath.indexOf('?') >= 0 ? '&' : '?';
    this.loading = true;
    this.error = '';
    this.api.call(cfg.listPath + sep + OSOS_API.pageQuery(this.pageIndex, this.pageSize)).then((res: any) => {
      if (cfg !== this.config) {
        return;
      }
      const items = Array.isArray(res) ? res : ((res && res.items) || []);
      this.rows = items;
      this.total = Array.isArray(res) ? res.length : ((res && typeof res.count === 'number') ? res.count : items.length);
      this.loading = false;
    }, (e: any) => {
      this.loading = false;
      this.rows = [];
      this.total = 0;
      this.error = 'Load failed: ' + (e && e.status ? e.status : String(e));
      if (e && e.status === 401) {
        this.auth.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  goPage(index: number): void {
    this.pageIndex = index;
    this.load();
  }

  setPageSize(size: number): void {
    this.pageSize = +size;
    this.pageIndex = 0;
    this.load();
  }

  open(action: RowAction, id: string): void {
    if (action === 'delete') {
      this.remove(id);
      return;
    }
    this.router.navigate(['/', this.entity, action, id]);
  }

  create(): void {
    this.router.navigate(['/', this.entity, 'new']);
  }

  private remove(id: string): void {
    const cfg = this.config;
    if (!cfg || !window.confirm('Delete this record?')) {
      return;
    }
    this.api.call(cfg.deletePath(id), 'DELETE').then(() => this.load(), (e: any) => {
      this.error = 'Delete failed: ' + (e && e.status ? e.status : String(e));
    });
  }
}
