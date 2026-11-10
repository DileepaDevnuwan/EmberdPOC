import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FilterFormPageComponent,
  FilterPreviewOptionsRequest,
  FilterPreviewRequest,
} from '@osos-dashboard/ui';
import {
  DashboardDataset,
  DashboardFilter,
  DatasetField,
  initialDashboardFilter,
} from '@osos/core/dashboard';
import { of } from 'rxjs';
import { FormHostBase } from './form-host.base';

@Component({
  selector: 'app-filter-form-host',
  imports: [FilterFormPageComponent],
  template: `
    @if (filter(); as f) {
      <app-filter-form-page
        [mode]="mode()"
        [filter]="f"
        [modules]="modules()"
        [datasets]="datasets()"
        [datasetFields]="datasetFields()"
        (modeChange)="mode.set($event)"
        (cancelled)="backToList()"
        (save)="save($event)"
        (loadPreview)="loadPreview($event)"
        (previewPageRequest)="answerPreviewPage($event)" />
    }
  `,
})
export class FilterFormHostComponent extends FormHostBase {
  readonly filter = signal<DashboardFilter | null>(null);
  readonly datasets = signal<DashboardDataset[]>([]);
  readonly datasetFields = signal<DatasetField[]>([]);

  constructor() {
    super();
    if (this.isNew) {
      this.filter.set(initialDashboardFilter);
    } else {
      this.api.getFilter(this.id).pipe(takeUntilDestroyed()).subscribe(f => this.filter.set(f));
    }
    this.api.getAllDatasets().pipe(takeUntilDestroyed()).subscribe(d => this.datasets.set(d));
  }

  loadPreview(request: FilterPreviewRequest): void {
    if (!request.datasetId) {
      this.notification.error('translate.configuration.dashboard.filter.notification.selectDataset');
      return;
    }
    this.api
      .getDatasetFields(request.datasetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fields => this.datasetFields.set(fields));
  }

  answerPreviewPage(request: FilterPreviewOptionsRequest): void {
    const { datasetId, valueField, labelField, ...page } = request.args;
    request.reply(
      datasetId
        ? this.api.getDropdownOptions(datasetId, page, valueField, labelField)
        : of({ items: [], hasMore: false })
    );
  }

  save(filter: DashboardFilter): void {
    this.api
      .saveFilter(filter, this.isNew)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.saved(), error: () => this.failed() });
  }
}
