import type { DashboardFilterEntity, DashboardHierarchyEntity } from '@osos/core/dashboard';
import { TableAction, TableColumnType } from '@osos/core/enums';
import type { Column, TableColumn } from '@osos/core/models';

const ACTIONS: Column = {
  type: TableColumnType.Action,
  columnDef: 'actions',
  header: '',
  cell: () => '',
  actions: [
    { type: TableAction.View, label: 'translate.common.actionbutton.view', iconCss: 'material-icons-outlined', icon: 'visibility', buttonCss: 'action-items', menuId: '' },
    { type: TableAction.Delete, label: 'translate.common.actionbutton.delete', iconCss: 'material-icons-outlined', icon: 'delete_outline', buttonCss: 'action-items danger', menuId: '' },
  ],
} as Column;

export const HIERARCHY_COLUMNS: Column[] = [
  ACTIONS,
  { type: TableColumnType.Text, columnDef: 'code', header: 'translate.configuration.dashboard.hierarchy.label.code', cell: (e: DashboardHierarchyEntity) => e.code },
  { type: TableColumnType.Text, columnDef: 'hierarchyName', header: 'translate.configuration.dashboard.hierarchy.label.name', cell: (e: DashboardHierarchyEntity) => e.hierarchyName },
  { type: TableColumnType.Text, columnDef: 'module', header: 'translate.configuration.dashboard.hierarchy.label.module', cell: (e: DashboardHierarchyEntity) => e.module },
  { type: TableColumnType.Date, columnDef: 'createdDate', header: 'translate.configuration.dashboard.dataset.columnheader.createdDate', cell: (e: DashboardHierarchyEntity) => e.createdDate },
  { type: TableColumnType.Status, columnDef: 'status', header: 'translate.configuration.dashboard.dataset.columnheader.status', cell: (e: DashboardHierarchyEntity) => e.status },
] as Column[];

export const FILTER_COLUMNS: Column[] = [
  ACTIONS,
  { type: TableColumnType.Text, columnDef: 'code', header: 'translate.configuration.dashboard.filter.label.code', cell: (e: DashboardFilterEntity) => e.code },
  { type: TableColumnType.Text, columnDef: 'displayName', header: 'translate.configuration.dashboard.filter.label.displayName', cell: (e: DashboardFilterEntity) => e.displayName },
  { type: TableColumnType.Text, columnDef: 'moduleScope', header: 'translate.configuration.dashboard.filter.label.moduleScope', cell: (e: DashboardFilterEntity) => e.moduleScope },
  { type: TableColumnType.Date, columnDef: 'createdDate', header: 'translate.configuration.dashboard.dataset.columnheader.createdDate', cell: (e: DashboardFilterEntity) => e.createdDate },
  { type: TableColumnType.Status, columnDef: 'status', header: 'translate.configuration.dashboard.dataset.columnheader.status', cell: (e: DashboardFilterEntity) => e.status },
] as Column[];

/** External lists have no saved column selection: every displayed column is available and selected. */
export function toAvailableColumns(columns: Column[]): TableColumn[] {
  return columns
    .filter(c => c.columnDef !== 'actions')
    .map((c, i) => ({
      id: i + 1,
      name: c.columnDef,
      displayName: c.header,
      path: c.columnDef,
      isInsideObject: false,
      allowedFilters: '',
      dataType: 'string',
      isDefault: true,
      isSelected: true,
      allowSearch: false,
      allowSort: false,
      allowFilter: false,
      allowColumnSelection: false,
    }));
}
