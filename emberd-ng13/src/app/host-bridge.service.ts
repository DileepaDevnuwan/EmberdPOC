import { Injectable } from '@angular/core';
import { EmbedApiService } from './embed-api.service';
import { OSOS_API } from './osos.config';

@Injectable()
export class HostBridgeService {
  private started = false;

  constructor(private api: EmbedApiService) {}

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    const api = this.api;
    document.addEventListener(OSOS_API.requestEvent, function (event: Event) {
      const detail = (event as CustomEvent).detail || {};
      if (!detail.path || typeof detail.reply !== 'function') {
        return;
      }
      const method = detail.method || 'GET';
      const isDownload = typeof detail.call === 'string' && /\.download$/.test(detail.call);
      if (isDownload) {
        detail.reply(api.raw(detail.path, method, detail.body).then(function (res) {
          if (!res.ok) {
            throw { status: res.status, error: null };
          }
          return res;
        }));
        return;
      }
      detail.reply(api.call(detail.path, method, detail.body));
    });
  }
}
