import { DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { embedModulesToModules } from '@osos-dashboard/ui';
import { Crud } from '@osos/core/enums';
import { SnackBarNotificationService } from '@osos/core/services';
import { getModeFromParams } from '@osos/core/utils';
import { map } from 'rxjs';
import { DashboardEmbedConfigApiService } from '@osos-dashboard/ui/data-access';

/** Shared form-host logic: mode from the route, the tenant's modules, back to the list. */
export abstract class FormHostBase {
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly api = inject(DashboardEmbedConfigApiService);
  protected readonly notification = inject(SnackBarNotificationService);

  readonly mode = signal<Crud>(getModeFromParams(this.route.snapshot));
  readonly modules = toSignal(this.api.getModules().pipe(map(embedModulesToModules)), { initialValue: [] });
  readonly id = (this.route.snapshot.params['id'] as string) ?? '';
  readonly isNew = this.mode() === Crud.Create;

  backToList(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  protected saved(): void {
    this.notification.success('snack-notification.save-success');
    this.backToList();
  }

  protected failed(): void {
    this.notification.error('snack-notification.save-fail');
  }
}
