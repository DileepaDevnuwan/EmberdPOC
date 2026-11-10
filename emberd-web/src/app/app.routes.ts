import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { dashboardResolver } from './core/resolvers/dashboard.resolver';
import { provideHardcodedDashboard } from './core/hardcoded/hardcoded.providers';

/** The Dashboard configuration pages; mounted under /dashboard (live) and /hardcoded/dashboard. */
function dashboardRoutes(): Routes {
  return [
    {
      path: '',
      pathMatch: 'full',
      loadComponent: () => import('./pages/dashboard-config/dashboard-list-host.component').then(c => c.DashboardListHostComponent),
    },
    {
      path: 'view/:id',
      loadComponent: () => import('@osos-dashboard/ui').then(c => c.DashboardViewerPageComponent),
    },
    {
      path: 'dataset',
      children: [
        { path: '', pathMatch: 'full', loadComponent: () => import('./pages/dashboard-config/dataset-list-host.component').then(c => c.DatasetListHostComponent) },
        { path: ':id', loadComponent: () => import('./pages/dashboard-config/dataset-form-host.component').then(c => c.DatasetFormHostComponent) },
      ],
    },
    {
      path: 'hierarchy',
      children: [
        { path: '', pathMatch: 'full', loadComponent: () => import('./pages/dashboard-config/hierarchy-list-host.component').then(c => c.HierarchyListHostComponent) },
        { path: ':id', loadComponent: () => import('./pages/dashboard-config/hierarchy-form-host.component').then(c => c.HierarchyFormHostComponent) },
      ],
    },
    {
      path: 'filter',
      children: [
        { path: '', pathMatch: 'full', loadComponent: () => import('./pages/dashboard-config/filter-list-host.component').then(c => c.FilterListHostComponent) },
        { path: ':id', loadComponent: () => import('./pages/dashboard-config/filter-form-host.component').then(c => c.FilterFormHostComponent) },
      ],
    },
    {
      path: 'data-sources',
      loadComponent: () => import('./pages/dashboard-config/data-connectors-host.component').then(c => c.DataConnectorsHostComponent),
    },
    {
      path: ':id',
      resolve: { entity: dashboardResolver },
      loadComponent: () => import('@osos-dashboard/ui').then(c => c.DashboardBuilderPageComponent),
    },
  ];
}

const insightHub = () => import('./pages/master/insight-hub/insight-hub-host.component').then(m => m.InsightHubHostComponent);
const access = () => import('./pages/access/access-host.component').then(m => m.AccessHostComponent);

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'master/users', pathMatch: 'full' },
      { path: 'master/users', loadComponent: () => import('./pages/master/users/users.component').then(m => m.UsersComponent) },
      { path: 'master/roles', loadComponent: () => import('./pages/master/roles/roles.component').then(m => m.RolesComponent) },
      { path: 'master/products', loadComponent: () => import('./pages/master/products/products.component').then(m => m.ProductsComponent) },
      { path: 'master/customers', loadComponent: () => import('./pages/master/customers/customers.component').then(m => m.CustomersComponent) },
      { path: 'master/insight-hub', loadComponent: insightHub },
      { path: 'sales', loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent) },
      { path: 'access', loadComponent: access },
      { path: 'dashboard', children: dashboardRoutes() },
      {
        // Hardcoded mode: the same host pages, answered by the back end's JSON store.
        path: 'hardcoded',
        providers: provideHardcodedDashboard(),
        children: [
          { path: 'insight-hub', loadComponent: insightHub, data: { hubApiPrefix: '/hardcoded' } },
          { path: 'access', loadComponent: access },
          { path: 'dashboard', children: dashboardRoutes() },
        ],
      },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
