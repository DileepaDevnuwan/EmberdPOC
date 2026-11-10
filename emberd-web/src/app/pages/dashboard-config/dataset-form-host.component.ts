import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  answerConnectorRequest,
  buildSaveDatasetRequest,
  ConnectorHostRequest,
  DatasetFormPageComponent,
} from '@osos-dashboard/ui';
import { DashboardDataset, DatasetField, initialDashboardDataset } from '@osos/core/dashboard';
import { DashboardEmbedConnectorApiService } from '@osos-dashboard/ui/data-access';
import { FormHostBase } from './form-host.base';

@Component({
  selector: 'app-dataset-form-host',
  imports: [DatasetFormPageComponent],
  template: `
    @if (dataset(); as d) {
      <app-dataset-form-page
        [mode]="mode()"
        [dataset]="d"
        [modules]="modules()"
        [detectedFields]="detectedFields()"
        (modeChange)="mode.set($event)"
        (cancelled)="backToList()"
        (save)="save($event)"
        (detectFields)="detect($event)"
        (connectorRequest)="answer($event)" />
    }
  `,
})
export class DatasetFormHostComponent extends FormHostBase {
  readonly #connectors = inject(DashboardEmbedConnectorApiService);
  readonly dataset = signal<DashboardDataset | null>(null);
  readonly detectedFields = signal<DatasetField[] | null>(null);

  constructor() {
    super();
    if (this.isNew) {
      this.dataset.set(initialDashboardDataset);
    } else {
      this.api.getDataset(this.id).pipe(takeUntilDestroyed()).subscribe(d => this.dataset.set(d));
    }
  }

  answer(request: ConnectorHostRequest): void {
    answerConnectorRequest(this.#connectors, request);
  }

  detect(id: string): void {
    this.api
      .detectFields(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fields => this.detectedFields.set(fields));
  }

  save(dataset: DashboardDataset): void {
    const request = buildSaveDatasetRequest(dataset, { isNew: this.isNew, connectorsEnabled: true });
    this.api
      .saveDataset(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.saved(), error: () => this.failed() });
  }
}
