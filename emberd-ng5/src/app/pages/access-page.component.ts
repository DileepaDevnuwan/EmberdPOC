import { Component, OnInit } from '@angular/core';
import { BundleLoaderService } from '../bundle-loader.service';
import { describeError, EmbedApiService } from '../embed-api.service';

function accessPath(principal: any): string {
  return '/dashboard-access/' + principal.type + '/' + encodeURIComponent(principal.id);
}

@Component({
  selector: 'app-access-page',
  templateUrl: './access-page.component.html'
})
export class AccessPageComponent implements OnInit {
  ready = false;
  error = '';
  access: any = null;
  loading = false;
  principals = [
    { id: 'Admin', name: 'Admin', type: 'Role', meta: 'Full access' },
    { id: 'SalesManager', name: 'Sales Manager', type: 'Role', meta: 'Sales team' },
    { id: 'u-1001', name: 'Alice Perera', type: 'User', meta: 'alice@host.demo' }
  ];

  constructor(private bundle: BundleLoaderService, private api: EmbedApiService) {}

  ngOnInit(): void {
    this.bundle.load().then(() => { this.ready = true; });
  }

  load(principal: any): void {
    this.loading = true;
    this.api.call(accessPath(principal)).then((access: any) => {
      this.access = access;
      this.loading = false;
    }, (e: any) => {
      this.access = { dashboards: [], datasets: [] };
      this.loading = false;
      this.error = 'Load failed: ' + (e && e.status ? e.status : String(e));
    });
  }

  onSave(event: any): void {
    this.api.call(accessPath(event.principal), 'PUT', event.request).then(() => this.load(event.principal), (e: any) => {
      this.error = 'save failed: ' + describeError(e);
    });
  }

  answerOptions(path: string, detail: any): void {
    const args = detail.args || {};
    const skip = args.skip || 0;
    const take = args.take || 20;
    detail.reply(this.api.call(path + '?$top=' + take + '&$skip=' + skip + '&$count=true').then((page: any) => {
      const items = (page && page.items) || [];
      return {
        items: items.map((item: any) => ({ id: item.id, name: item.name })),
        hasMore: items.length > 0 && skip + items.length < ((page && page.count) || 0)
      };
    }));
  }

  answerDatasetFields(detail: any): void {
    detail.reply(this.api.call('/dashboard-datasets/' + detail.args).then((json: any) => {
      return this.bundle.api.fromApi.dataset(json).fields || [];
    }));
  }
}
