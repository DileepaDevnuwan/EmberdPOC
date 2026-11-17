import { Injectable } from '@angular/core';
import { OSOS_BUNDLE } from './osos.config';

@Injectable()
export class BundleLoaderService {
  private ready: Promise<any> | null = null;

  load(): Promise<any> {
    if (this.ready) {
      return this.ready;
    }
    const base = OSOS_BUNDLE.base;
    if (!document.querySelector('link[data-osos-bundle]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = base + '/' + OSOS_BUNDLE.styles;
      link.setAttribute('data-osos-bundle', base);
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-osos-bundle]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = base + '/' + OSOS_BUNDLE.script;
      script.setAttribute('data-osos-bundle', base);
      document.head.appendChild(script);
    }
    this.ready = (window as any).customElements.whenDefined(OSOS_BUNDLE.probeTag).then(function () {
      const api = (window as any)[OSOS_BUNDLE.globalName];
      if (api && OSOS_BUNDLE.syncfusionLicense && typeof api.registerSyncfusionLicense === 'function') {
        api.registerSyncfusionLicense(OSOS_BUNDLE.syncfusionLicense);
      }
      return api;
    });
    return this.ready;
  }

  get api(): any {
    return (window as any)[OSOS_BUNDLE.globalName];
  }
}
