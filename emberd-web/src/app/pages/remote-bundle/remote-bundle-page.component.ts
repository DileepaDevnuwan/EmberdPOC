import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import {
  BUNDLE_CRUD,
  BundleAccessComponent,
  BundleCrudComponent,
  BundleDashboardsComponent,
  BundleInsightHubComponent,
} from './bundle-menus.component';
import { loadOsosBundle, startHostBridge } from './remote-bundle.api';

@Component({
  selector: 'app-remote-bundle-page',
  imports: [BundleInsightHubComponent, BundleDashboardsComponent, BundleCrudComponent, BundleAccessComponent],
  template: `
    @if (!ready()) {
      <p class="muted">Loading Dashboard bundle...</p>
    } @else {
      @switch (menu()) {
        @case ('insight-hub') { <app-bundle-insight-hub /> }
        @case ('dashboards') { <app-bundle-dashboards /> }
        @case ('access') { <app-bundle-access /> }
        @default {
          @if (crud(); as config) {
            @for (c of [config]; track menu()) { <app-bundle-crud [config]="c" /> }
          } @else {
            <p class="muted">Unknown menu.</p>
          }
        }
      }
    }
  `,
  styles: [`.muted { color:#777; font-size:13px; }`],
})
export class RemoteBundlePageComponent {
  readonly menu = toSignal(inject(ActivatedRoute).paramMap.pipe(map(p => p.get('menu') ?? '')), { initialValue: '' });
  readonly crud = computed(() => BUNDLE_CRUD[this.menu()]);
  readonly ready = signal(false);

  constructor() {
    const stopBridge = startHostBridge();
    inject(DestroyRef).onDestroy(stopBridge);
    void loadOsosBundle().then(() => this.ready.set(true));
  }
}
