import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DashboardInsightHubComponent } from '@osos-dashboard/ui';
import type { ObpDashboardEntity } from '@osos/core/dashboard';
import { ApiService } from '../../../core/services/api.service';

/** The module this page belongs to; the hub shows its dashboards plus the global ones. */
const HUB_MODULE = 'SALES';

/**
 * Hosts the package's Insight Hub. Our back end asks the Dashboard service for the published
 * GLOBAL + module dashboards; the page binds the response to the hub's input.
 */
@Component({
  selector: 'app-insight-hub-host',
  imports: [DashboardInsightHubComponent],
  template: `
    <div class="host-header"><h2>Insight Hub</h2></div>
    <app-dashboard-insight-hub [dashboards]="dashboards()" [loading]="loading()" />
  `,
  styles: [`
    .host-header { background:#fff; border-radius:8px; padding:12px 16px; margin-bottom:12px; }
    h2 { margin:0; font-size:18px; color:#1a1a2e; }
  `],
})
export class InsightHubHostComponent {
  readonly #api = inject(ApiService);
  /** '/hardcoded' under the Hardcoded menu (route data); empty for the live hub. */
  readonly #apiPrefix: string = inject(ActivatedRoute).snapshot.data['hubApiPrefix'] ?? '';
  readonly dashboards = signal<ObpDashboardEntity[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.#load();
  }

  async #load(): Promise<void> {
    try {
      this.dashboards.set(await this.#api.get<ObpDashboardEntity[]>(`${this.#apiPrefix}/api/dashboard-hub/${HUB_MODULE}`));
    } catch {
      this.dashboards.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
