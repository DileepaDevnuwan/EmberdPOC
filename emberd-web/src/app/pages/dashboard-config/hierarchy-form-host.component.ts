import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HierarchyFormPageComponent, HierarchyReferenceValidationRequest } from '@osos-dashboard/ui';
import {
  DashboardHierarchy,
  DatasetField,
  initialDashboardHierarchy,
  ReferenceValidationResult,
  SourceDatasetOption,
} from '@osos/core/dashboard';
import { map } from 'rxjs';
import { FormHostBase } from './form-host.base';

@Component({
  selector: 'app-hierarchy-form-host',
  imports: [HierarchyFormPageComponent],
  template: `
    @if (hierarchy(); as h) {
      <app-hierarchy-form-page
        [mode]="mode()"
        [hierarchy]="h"
        [modules]="modules()"
        [sourceDatasets]="sourceDatasets()"
        [referenceValidation]="referenceValidation()"
        [sourceDatasetColumns]="sourceColumns()"
        (modeChange)="mode.set($event)"
        (cancelled)="backToList()"
        (save)="save($event)"
        (validateReference)="validate($event)"
        (sourceDatasetSelected)="loadSourceColumns($event)" />
    }
  `,
})
export class HierarchyFormHostComponent extends FormHostBase {
  readonly hierarchy = signal<DashboardHierarchy | null>(null);
  readonly sourceDatasets = signal<SourceDatasetOption[]>([]);
  readonly referenceValidation = signal<ReferenceValidationResult | null>(null);
  readonly sourceColumns = signal<DatasetField[] | null>(null);

  constructor() {
    super();
    if (this.isNew) {
      this.hierarchy.set(initialDashboardHierarchy);
    } else {
      this.api.getHierarchy(this.id).pipe(takeUntilDestroyed()).subscribe(h => this.hierarchy.set(h));
    }
    // External: the hierarchy's source is one of the tenant's Dashboard datasets.
    this.api
      .getAllDatasets()
      .pipe(
        map(items => items.map(d => ({ id: d.id, name: d.name, code: d.code }))),
        takeUntilDestroyed()
      )
      .subscribe(options => this.sourceDatasets.set(options));
  }

  loadSourceColumns(datasetId: string): void {
    if (!datasetId) {
      this.sourceColumns.set([]);
      return;
    }
    this.sourceColumns.set(null);
    this.api
      .getDatasetFields(datasetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fields => this.sourceColumns.set(fields));
  }

  validate(request: HierarchyReferenceValidationRequest): void {
    if (this.isNew) {
      this.referenceValidation.set({ valid: false });
      return;
    }
    this.api
      .validateHierarchyLink(request.datasetId, this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => this.referenceValidation.set(result),
        error: () => this.referenceValidation.set({ valid: false }),
      });
  }

  save(hierarchy: DashboardHierarchy): void {
    this.api
      .saveHierarchy(hierarchy, this.isNew)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.saved(), error: () => this.failed() });
  }
}
