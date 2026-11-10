import { HttpParams } from '@angular/common/http';
import { Component, inject, viewChild } from '@angular/core';
import { DashboardListComponent, getDashboardDisplayColumns } from '@osos-dashboard/ui';
import type { ObpDashboardEntity } from '@osos/core/dashboard';
import { DashboardEmbedConfigApiService } from '@osos-dashboard/ui/data-access';
import { HostListHeaderComponent } from './host-list-header.component';
import { ListHostBase } from './list-host.base';
import { toAvailableColumns } from './list-columns';

@Component({
  selector: 'app-dashboard-list-host',
  imports: [HostListHeaderComponent, DashboardListComponent],
  template: `
    <app-host-list-header title="Dashboards" addLabel="Add Dashboard" (searchChange)="search($event)" (add)="add()" />
    <app-dashboard-list
      [dashboards]="rows()"
      [count]="count()"
      [displayedColumns]="columns"
      [availableColumns]="availableColumns"
      [pageEvent]="pageEvent()"
      [favoriteState]="false"
      [userFilters]="userFilters"
      [dialogHost]="dialogHost"
      (searchByText)="search($event)"
      (pageChanges)="changePage($event)"
      (handleUserEvents)="handleUserEvents($event)" />
  `,
})
export class DashboardListHostComponent extends ListHostBase<ObpDashboardEntity> {
  protected readonly searchFields = ['code', 'name'];
  readonly #api = inject(DashboardEmbedConfigApiService);
  readonly columns = getDashboardDisplayColumns(false);
  readonly availableColumns = toAvailableColumns(this.columns);
  readonly dialogHost = this.#api.addDashboardDialogHost();
  private readonly list = viewChild.required(DashboardListComponent);

  /** The host's Add button opens the package's own Add Dashboard dialog. */
  override add(): void {
    this.list().openAddDialog();
  }

  constructor() {
    super();
    this.load();
  }

  protected fetch(params: HttpParams) {
    return this.#api.getDashboards(params);
  }

  protected remove(id: string) {
    return this.#api.deleteDashboard(id);
  }
}
