import { Component, OnInit } from '@angular/core';
import { BundleLoaderService } from '../bundle-loader.service';
import { describeError, EmbedApiService } from '../embed-api.service';

const DATA_SOURCES = '/data-sources';
const QUERIES = '/data-source-queries';

const CONNECTOR_CALLS: { [method: string]: (...args: any[]) => any[] } = {
  getTypes: function () { return ['GET', DATA_SOURCES + '/types']; },
  getAll: function () { return ['GET', DATA_SOURCES]; },
  getById: function (id: string) { return ['GET', DATA_SOURCES + '/' + id]; },
  create: function (request: any) { return ['POST', DATA_SOURCES, request]; },
  update: function (id: string, request: any) { return ['PUT', DATA_SOURCES + '/' + id, request]; },
  delete: function (id: string) { return ['DELETE', DATA_SOURCES + '/' + id]; },
  test: function (request: any) { return ['POST', DATA_SOURCES + '/test', request]; },
  testSaved: function (id: string) { return ['POST', DATA_SOURCES + '/' + id + '/test', {}]; },
  getObjects: function (id: string) { return ['GET', DATA_SOURCES + '/' + id + '/objects']; },
  getColumns: function (id: string, object: any) {
    const schema = encodeURIComponent((object && object.schema) || '');
    const name = encodeURIComponent((object && object.name) || '');
    return ['GET', DATA_SOURCES + '/' + id + '/columns?schema=' + schema + '&name=' + name];
  },
  getRelationships: function (id: string) { return ['GET', DATA_SOURCES + '/' + id + '/relationships']; },
  previewObject: function (id: string, object: any) { return ['POST', DATA_SOURCES + '/' + id + '/preview', object]; },
  getPermissions: function (id: string) { return ['GET', DATA_SOURCES + '/' + id + '/permissions']; },
  savePermissions: function (id: string, permissions: any) { return ['PUT', DATA_SOURCES + '/' + id + '/permissions', permissions]; },
  renderDesign: function (id: string, design: any) { return ['POST', QUERIES + '/' + id + '/design/render', { design: design }]; },
  validateFormula: function (id: string, request: any) { return ['POST', QUERIES + '/' + id + '/design/validate-formula', request]; },
  previewQuery: function (id: string, request: any) { return ['POST', QUERIES + '/' + id + '/preview', request]; },
  describeQuery: function (id: string, request: any) { return ['POST', QUERIES + '/' + id + '/describe', request]; }
};

@Component({
  selector: 'app-data-sources-page',
  templateUrl: './data-sources-page.component.html'
})
export class DataSourcesPageComponent implements OnInit {
  ready = false;
  error = '';
  dataSources: any[] = [];
  features = { isEnabled: true, isMySqlEnabled: true };
  loading = false;
  testingId: string | null = null;

  constructor(private bundle: BundleLoaderService, private api: EmbedApiService) {}

  ngOnInit(): void {
    this.bundle.load().then(() => {
      this.ready = true;
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.api.call(DATA_SOURCES).then((list: any) => {
      this.dataSources = Array.isArray(list) ? list : ((list && list.items) || []);
      this.loading = false;
    }, (e: any) => {
      this.loading = false;
      this.error = 'Load failed: ' + (e && e.status ? e.status : String(e));
    });
  }

  onConnectorRequest(detail: any): void {
    const request = detail.args || {};
    if (request.method === 'listPrincipals') {
      detail.reply(Promise.resolve({ users: [], roles: [] }));
      return;
    }
    const route = CONNECTOR_CALLS[request.method];
    if (!route) {
      detail.reply(Promise.reject(new Error('Unknown connector call ' + request.method)));
      return;
    }
    const target = route.apply(null, request.args || []);
    detail.reply(this.api.call(target[1], target[0], target[2]));
  }

  onTestConnection(id: string): void {
    this.testingId = id;
    this.api.call(DATA_SOURCES + '/' + id + '/test', 'POST', {}).then(() => {
      this.testingId = null;
      this.load();
    }, (e: any) => {
      this.testingId = null;
      this.error = 'testConnection failed: ' + describeError(e);
    });
  }

  onDeleteDataSource(row: any): void {
    this.api.call(DATA_SOURCES + '/' + row.id, 'DELETE').then(() => this.load(), (e: any) => {
      this.error = 'deleteDataSource failed: ' + describeError(e);
    });
  }
}
