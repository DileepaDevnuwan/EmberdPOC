import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './login.component';
import { ShellComponent } from './shell.component';
import { EntityListComponent } from './entity-list.component';
import { DashboardCreatePageComponent } from './pages/dashboard-create-page.component';
import { DashboardViewPageComponent } from './pages/dashboard-view-page.component';
import { DashboardDesignPageComponent } from './pages/dashboard-design-page.component';
import { DatasetFormPageComponent } from './pages/dataset-form-page.component';
import { FilterFormPageComponent } from './pages/filter-form-page.component';
import { HierarchyFormPageComponent } from './pages/hierarchy-form-page.component';
import { DataSourcesPageComponent } from './pages/data-sources-page.component';
import { AccessPageComponent } from './pages/access-page.component';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { EmbedApiService } from './embed-api.service';
import { BundleLoaderService } from './bundle-loader.service';
import { HostBridgeService } from './host-bridge.service';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboards' },
      { path: 'dashboards/new', component: DashboardCreatePageComponent },
      { path: 'dashboards/view/:id', component: DashboardViewPageComponent },
      { path: 'dashboards/design/:id', component: DashboardDesignPageComponent },
      { path: 'datasets/new', component: DatasetFormPageComponent },
      { path: 'datasets/edit/:id', component: DatasetFormPageComponent },
      { path: 'filters/new', component: FilterFormPageComponent },
      { path: 'filters/edit/:id', component: FilterFormPageComponent },
      { path: 'hierarchies/new', component: HierarchyFormPageComponent },
      { path: 'hierarchies/edit/:id', component: HierarchyFormPageComponent },
      { path: 'data-sources/page', component: DataSourcesPageComponent },
      { path: 'access/page', component: AccessPageComponent },
      { path: ':entity', component: EntityListComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ShellComponent,
    EntityListComponent,
    DashboardCreatePageComponent,
    DashboardViewPageComponent,
    DashboardDesignPageComponent,
    DatasetFormPageComponent,
    FilterFormPageComponent,
    HierarchyFormPageComponent,
    DataSourcesPageComponent,
    AccessPageComponent
  ],
  imports: [BrowserModule, FormsModule, RouterModule.forRoot(routes)],
  providers: [AuthService, AuthGuard, EmbedApiService, BundleLoaderService, HostBridgeService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {}
