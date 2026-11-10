import { HttpParams } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { DATASET_DISPLAY_COLUMNS, DatasetListComponent } from '@osos-dashboard/ui';
import type { DashboardDatasetEntity } from '@osos/core/dashboard';
import { DashboardEmbedConfigApiService } from '@osos-dashboard/ui/data-access';
import { HostListHeaderComponent } from './host-list-header.component';
import { ListHostBase } from './list-host.base';
import { toAvailableColumns } from './list-columns';

@Component({
  selector: 'app-dataset-list-host',
  imports: [HostListHeaderComponent, DatasetListComponent],
  template: `
    <app-host-list-header title="Datasets" addLabel="Add Dataset" (searchChange)="search($event)" (add)="add()" />
    <app-dataset-list
      [datasets]="rows()"
      [count]="count()"
      [displayedColumns]="columns"
      [availableColumns]="availableColumns"
      [pageEvent]="pageEvent()"
      [favoriteState]="false"
      [userFilters]="userFilters"
      [isListView]="true"
      (searchByText)="search($event)"
      (pageChanges)="changePage($event)"
      (handleUserEvents)="handleUserEvents($event)" />
  `,
})
export class DatasetListHostComponent extends ListHostBase<DashboardDatasetEntity> {
  protected readonly searchFields = ['code', 'name'];
  readonly #api = inject(DashboardEmbedConfigApiService);
  readonly columns = DATASET_DISPLAY_COLUMNS;
  readonly availableColumns = toAvailableColumns(DATASET_DISPLAY_COLUMNS);

  constructor() {
    super();
    this.load();
  }

  protected fetch(params: HttpParams) {
    return this.#api.getDatasets(params);
  }

  protected remove(id: string) {
    return this.#api.deleteDataset(id);
  }
}
