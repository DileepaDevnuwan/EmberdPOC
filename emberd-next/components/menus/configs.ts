/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CrudConfig } from './CrudMenu';
import { answerConnector, api, isEmptyId, OE, type Mode } from '@/lib/client';

const HIERARCHIES = '/dashboard/semantic/hierarchies';

async function datasetOptions(mode: Mode) {
  const res = await api(mode, '/dashboard-datasets?$top=0');
  return (res?.items ?? []) as any[];
}

/** The form's `{ args, reply }` outputs we can answer from the API; unknown ones are logged. */
const dropdownOptionsPath = (datasetId: string, args: any) => {
  const { valueField, labelField, skip = 0, take = 20 } = args ?? {};
  const query = [`skip=${skip}`, `take=${take}`];
  if (valueField) query.push(`valueField=${encodeURIComponent(valueField)}`);
  if (labelField) query.push(`labelField=${encodeURIComponent(labelField)}`);
  return `/dashboard-datasets/${datasetId}/dropdown-options?${query.join('&')}`;
};

function logRequest(name: string) {
  return (detail: any) => console.info(`[host] ${name} (not handled in this demo)`, detail?.args);
}

export const datasetConfig: CrudConfig = {
  title: 'Datasets',
  listTag: 'osos-dataset-list',
  listProp: 'datasets',
  listPath: '/dashboard-datasets',
  formTag: 'osos-dataset-form',
  formProp: 'dataset',
  detailPath: id => `/dashboard-datasets/${id}`,
  deletePath: id => `/dashboard-datasets/${id}`,
  // The bundle maps the model and picks the path; the request goes out as an osos-request (HostBridge answers it).
  save: (_mode, model, isNew) => OE().save.dataset(model, isNew || isEmptyId(model.id)),
  formExtras: async mode => ({
    sourceDatasets: (await datasetOptions(mode)).map(d => ({ id: d.id, name: d.name, code: d.code })),
  }),
  formRequests: mode => ({ connectorRequest: (detail: any) => answerConnector(mode, detail) }),
};

export const filterConfig: CrudConfig = {
  title: 'Filters',
  listTag: 'osos-filter-list',
  listProp: 'filters',
  listPath: '/dashboard-filters',
  formTag: 'osos-filter-form',
  formProp: 'filter',
  detailPath: id => `/dashboard-filters/${id}`,
  deletePath: id => `/dashboard-filters/${id}`,
  mapRow: raw => ({ ...raw, ...OE().fromApi.filter(raw) }),
  save: (_mode, model, isNew) => OE().save.filter(model, isNew || isEmptyId(model.id)),
  formExtras: async mode => ({ datasets: await datasetOptions(mode) }),
  formRequests: mode => ({
    loadPreview: (detail: any, el?: any) => {
      if (!detail?.datasetId || !el) return;
      void api(mode, `/dashboard-datasets/${detail.datasetId}`).then(json => (el.datasetFields = OE().fromApi.dataset(json).fields ?? []));
    },
    previewPageRequest: (detail: any) => {
      const { datasetId, ...args } = detail?.args ?? {};
      detail?.reply?.(datasetId ? api(mode, dropdownOptionsPath(datasetId, args)) : Promise.resolve({ items: [], hasMore: false }));
    },
  }),
};

export const hierarchyConfig: CrudConfig = {
  title: 'Hierarchies',
  listTag: 'osos-hierarchy-list',
  listProp: 'hierarchies',
  listPath: HIERARCHIES,
  formTag: 'osos-hierarchy-form',
  formProp: 'hierarchy',
  detailPath: id => `${HIERARCHIES}/${id}`,
  deletePath: id => `${HIERARCHIES}/${id}`,
  mapRow: raw => ({ ...raw, ...OE().fromApi.hierarchy(raw) }),
  save: (_mode, model, isNew) => OE().save.hierarchy(model, isNew || isEmptyId(model.id)),
  formExtras: async mode => ({
    sourceDatasets: (await datasetOptions(mode)).map(d => ({ id: d.id, name: d.name, code: d.code })),
  }),
  formRequests: mode => ({
    validateReference: async (detail: any) => {
      const { datasetId, hierarchyId } = detail?.args ?? {};
      if (!detail?.reply) return;
      if (!datasetId || !hierarchyId) return detail.reply({ valid: true });
      detail.reply(
        api(mode, `/dashboard/semantic/dashboard-datasets/${datasetId}/validate/${hierarchyId}`).then(r => ({
          valid: !!r?.isValid,
          message: (r?.issues ?? []).map((i: any) => i.message).join(' ') || undefined,
        }))
      );
    },
  }),
};
