import { HttpInterceptorFn } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { MatDialog } from '@angular/material/dialog';
import {
  DashboardEmbedAccessApiService,
  DashboardEmbedApiService,
  DashboardEmbedConfigApiService,
  DashboardEmbedConnectorApiService,
  provideOsosDashboardEmbed,
} from '@osos-dashboard/ui/data-access';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

/** The back end's hardcoded twin of the embed API: same paths, answered from JSON files. */
export const HARDCODED_BASE_URL = `${environment.apiUrl}/hardcoded`;

/**
 * Route-level providers for the "Dashboard (Hardcoded)" menu: the same host pages, bound to the
 * hardcoded base URL. The data-access services are `providedIn: 'root'`; re-providing them here
 * gives this route's injector its own instances that read the hardcoded options. The dialogs are
 * re-provided so dialogs opened from these pages resolve their services from this injector too.
 */
export function provideHardcodedDashboard(): (Provider | EnvironmentProviders)[] {
  return [
    ...provideOsosDashboardEmbed({
      baseUrl: HARDCODED_BASE_URL,
      getToken: () => of(localStorage.getItem('token') ?? ''),
      getModule: () => null,
    }),
    DashboardEmbedApiService,
    DashboardEmbedConfigApiService,
    DashboardEmbedConnectorApiService,
    DashboardEmbedAccessApiService,
    Dialog,
    MatDialog,
  ];
}

/**
 * The package's auth interceptor is registered app-wide with the live options, so it only signs
 * live calls. This one adds the POC token to the hardcoded calls.
 */
export const hardcodedAuthInterceptor: HttpInterceptorFn = (request, next) =>
  request.url.startsWith(`${HARDCODED_BASE_URL}/`)
    ? next(request.clone({ setHeaders: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` } }))
    : next(request);
