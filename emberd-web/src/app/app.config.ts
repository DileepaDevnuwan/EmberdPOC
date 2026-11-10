import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { dashboardEmbedAuthInterceptor, provideOsosDashboardEmbed } from '@osos-dashboard/ui/data-access';
import { of } from 'rxjs';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { hardcodedAuthInterceptor } from './core/hardcoded/hardcoded.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([dashboardEmbedAuthInterceptor, hardcodedAuthInterceptor]), withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideStore(),
    provideEffects(),
    TranslateModule.forRoot({ defaultLanguage: 'en-US' }).providers!,
    // The browser calls only our own back end; it forwards /api/v1/embed/* to the Dashboard service.
    ...provideOsosDashboardEmbed({
      baseUrl: environment.apiUrl,
      getToken: () => of(localStorage.getItem('token') ?? ''),
      getModule: () => null,
    }),
  ]
};
