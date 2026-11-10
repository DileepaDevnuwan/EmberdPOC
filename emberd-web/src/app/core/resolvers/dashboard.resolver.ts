import { inject } from '@angular/core';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { initialObpDashboard, type ObpDashboard } from '@osos/core/dashboard';
import { Crud } from '@osos/core/enums';
import { getModeFromParams } from '@osos/core/utils';
import { Observable, of } from 'rxjs';
import { DashboardEmbedConfigApiService } from '@osos-dashboard/ui/data-access';

/** Loads the dashboard the builder page shows (edit copy when `?mode=edit`), like the ERP route does. */
export const dashboardResolver = (route: ActivatedRouteSnapshot): Observable<ObpDashboard> => {
  const mode = getModeFromParams(route);
  if (mode === Crud.Create) {
    return of(initialObpDashboard);
  }
  return inject(DashboardEmbedConfigApiService).getDashboard(route.params['id'] as string, mode === Crud.Update);
};
