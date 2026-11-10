import { HttpParams } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FilterListComponent } from '@osos-dashboard/ui';
import type { DashboardFilterEntity } from '@osos/core/dashboard';
import { DashboardEmbedConfigApiService } from '@osos-dashboard/ui/data-access';
import { HostListHeaderComponent } from './host-list-header.component';
import { ListHostBase } from './list-host.base';
import { FILTER_COLUMNS, toAvailableColumns } from './list-columns';

@Component({
  selector: 'app-filter-list-host',
  imports: [HostListHeaderComponent, FilterListComponent],
  template: `
    <app-host-list-header title="Filters" addLabel="Add Filter" (searchChange)="search($event)" (add)="add()" />
    <app-filter-list
      [filters]="rows()"
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
export class FilterListHostComponent extends ListHostBase<DashboardFilterEntity> {
  protected readonly searchFields = ['code', 'displayName'];
  readonly #api = inject(DashboardEmbedConfigApiService);
  readonly columns = FILTER_COLUMNS;
  readonly availableColumns = toAvailableColumns(FILTER_COLUMNS);

  constructor() {
    super();
    this.load();
  }

  protected fetch(params: HttpParams) {
    return this.#api.getFilters(params);
  }

  protected remove(id: string) {
    return this.#api.deleteFilter(id);
  }
}
