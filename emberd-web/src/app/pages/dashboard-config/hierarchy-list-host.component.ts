import { HttpParams } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { embedModulesToModules, HierarchyListComponent } from '@osos-dashboard/ui';
import type { DashboardHierarchyEntity } from '@osos/core/dashboard';
import { map } from 'rxjs';
import { DashboardEmbedConfigApiService } from '@osos-dashboard/ui/data-access';
import { HostListHeaderComponent } from './host-list-header.component';
import { ListHostBase } from './list-host.base';
import { HIERARCHY_COLUMNS, toAvailableColumns } from './list-columns';

@Component({
  selector: 'app-hierarchy-list-host',
  imports: [HostListHeaderComponent, HierarchyListComponent],
  template: `
    <app-host-list-header title="Hierarchies" addLabel="Add Hierarchy" (searchChange)="search($event)" (add)="add()" />
    <app-hierarchy-list
      [hierarchies]="rows()"
      [modules]="modules()"
      [count]="count()"
      [displayedColumns]="columns"
      [availableColumns]="availableColumns"
      [pageEvent]="pageEvent()"
      [favoriteState]="false"
      [userFilters]="userFilters"
      (searchByText)="search($event)"
      (pageChanges)="changePage($event)"
      (handleUserEvents)="handleUserEvents($event)" />
  `,
})
export class HierarchyListHostComponent extends ListHostBase<DashboardHierarchyEntity> {
  protected readonly searchFields = ['code', 'hierarchyName'];
  readonly #api = inject(DashboardEmbedConfigApiService);
  readonly columns = HIERARCHY_COLUMNS;
  readonly availableColumns = toAvailableColumns(HIERARCHY_COLUMNS);
  readonly modules = toSignal(this.#api.getModules().pipe(map(embedModulesToModules)), { initialValue: [] });

  constructor() {
    super();
    this.load();
  }

  protected fetch(params: HttpParams) {
    return this.#api.getHierarchies(params);
  }

  protected remove(id: string) {
    return this.#api.deleteHierarchy(id);
  }
}
