import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AccessOptionsRequest,
  AccessPageComponent,
  AccessPrincipal,
  AccessSaveEvent,
  DatasetFieldsRequest,
  PrincipalAccess,
} from '@osos-dashboard/ui';
import { DashboardEmbedAccessApiService, DashboardEmbedConfigApiService } from '@osos-dashboard/ui/data-access';
import { SnackBarNotificationService } from '@osos/core/services';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

interface ProductRole { name: string; description?: string | null; }
interface ProductUser { username: string; fullName: string; email: string; roles: string[]; }

/** Hosts the package's Access page: loads and saves grants through the data-access client. */
@Component({
  selector: 'app-access-host',
  imports: [AccessPageComponent],
  template: `
    <app-access-page
      [principals]="principals()"
      [access]="access()"
      [loading]="loading()"
      (principalSelected)="load($event)"
      (save)="save($event)"
      (dashboardOptionsRequest)="answerDashboards($event)"
      (datasetOptionsRequest)="answerDatasets($event)"
      (datasetFieldsRequest)="answerFields($event)" />
  `,
})
export class AccessHostComponent {
  readonly #api = inject(DashboardEmbedAccessApiService);
  readonly #config = inject(DashboardEmbedConfigApiService);
  readonly #notification = inject(SnackBarNotificationService);
  readonly #destroyRef = inject(DestroyRef);

  readonly #products = inject(ApiService);
  /** Our own roles and users, from our Roles / Users master data. Ids match the Dashboard token: role name, username. */
  readonly principals = signal<AccessPrincipal[]>([]);

  constructor() {
    void this.#loadPrincipals();
  }

  async #loadPrincipals(): Promise<void> {
    const [roles, users] = await Promise.all([
      this.#products.get<ProductRole[]>('/api/roles'),
      this.#products.get<ProductUser[]>('/api/users'),
    ]);
    const usersByRole = new Map<string, number>();
    for (const role of users.flatMap(u => u.roles ?? []))
      usersByRole.set(role, (usersByRole.get(role) ?? 0) + 1);
    const userCount = (n: number) => `${n} ${n === 1 ? 'user' : 'users'}`;
    this.principals.set([
      ...roles.map(r => ({ id: r.name, name: r.name, type: 'Role' as const, meta: userCount(usersByRole.get(r.name) ?? 0) })),
      ...users.map(u => ({ id: u.username, name: u.fullName, type: 'User' as const, meta: u.roles?.length ? `${u.email} · ${u.roles.join(', ')}` : u.email })),
    ]);
  }
  readonly access = signal<PrincipalAccess | null>(null);
  readonly loading = signal(false);

  load(principal: AccessPrincipal): void {
    this.access.set(null);
    this.loading.set(true);
    this.#api
      .getAccess(principal.type, principal.id)
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: access => this.access.set(access),
        error: () => this.#notification.error('snack-notification.save-fail'),
      });
  }

  save({ principal, request }: AccessSaveEvent): void {
    this.loading.set(true);
    this.#api
      .saveAccess(principal.type, principal.id, request)
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.#notification.success('snack-notification.save-success');
          this.load(principal);
        },
        error: () => this.#notification.error('snack-notification.save-fail'),
      });
  }

  answerDashboards(request: AccessOptionsRequest): void {
    request.reply(this.#api.getDashboardOptions(request.args));
  }

  answerDatasets(request: AccessOptionsRequest): void {
    request.reply(this.#api.getDatasetOptions(request.args));
  }

  answerFields(request: DatasetFieldsRequest): void {
    request.reply(this.#config.getDatasetFields(request.args));
  }
}
