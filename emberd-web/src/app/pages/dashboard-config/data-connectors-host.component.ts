import { Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  answerConnectorRequest,
  ConnectorHostRequest,
  DATA_SOURCE_NOTIFICATION_KEYS,
  DataSourceManagementPageComponent,
  problemDetailMessage,
} from '@osos-dashboard/ui';
import type { DataSourceSummary } from '@osos/core/connectors';
import { SnackBarNotificationService } from '@osos/core/services';
import { finalize } from 'rxjs';
import { DashboardEmbedConnectorApiService } from '@osos-dashboard/ui/data-access';
import { HostListHeaderComponent } from './host-list-header.component';

@Component({
  selector: 'app-data-connectors-host',
  imports: [HostListHeaderComponent, DataSourceManagementPageComponent],
  template: `
    <app-host-list-header
      title="Data Connectors"
      addLabel="Add Data Source"
      (searchChange)="page().search.set($event)"
      (add)="page().openDialog()" />
    <app-data-source-management-page
      [dataSources]="dataSources()"
      [features]="features"
      [isLoading]="isLoading()"
      [testingId]="testingId()"
      (connectorRequest)="answer($event)"
      (saved)="load()"
      (testConnection)="test($event)"
      (deleteDataSource)="remove($event)" />
  `,
})
export class DataConnectorsHostComponent {
  readonly #api = inject(DashboardEmbedConnectorApiService);
  readonly #notification = inject(SnackBarNotificationService);
  readonly #destroyRef = inject(DestroyRef);
  readonly page = viewChild.required(DataSourceManagementPageComponent);

  readonly features = { isEnabled: true, isMySqlEnabled: true };
  readonly dataSources = signal<DataSourceSummary[]>([]);
  readonly isLoading = signal(true);
  readonly testingId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  answer(request: ConnectorHostRequest): void {
    answerConnectorRequest(this.#api, request);
  }

  load(): void {
    this.isLoading.set(true);
    this.#api
      .getAll()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe({
        next: sources => this.dataSources.set(sources),
        error: () => this.#notification.error(DATA_SOURCE_NOTIFICATION_KEYS.loadFailed),
      });
  }

  test(id: string): void {
    this.testingId.set(id);
    this.#api
      .testSaved(id)
      .pipe(
        finalize(() => this.testingId.set(null)),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe({
        next: result =>
          result.success
            ? this.#notification.success(DATA_SOURCE_NOTIFICATION_KEYS.testSucceeded)
            : this.#notification.customError(result.message || DATA_SOURCE_NOTIFICATION_KEYS.testFailed),
        error: () => this.#notification.error(DATA_SOURCE_NOTIFICATION_KEYS.testFailed),
      });
  }

  remove(source: DataSourceSummary): void {
    this.#api
      .delete(source.id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.#notification.success(DATA_SOURCE_NOTIFICATION_KEYS.deleted);
          this.load();
        },
        error: (error: unknown) =>
          this.#notification.customError(problemDetailMessage(error) || DATA_SOURCE_NOTIFICATION_KEYS.deleteFailed),
      });
  }
}
