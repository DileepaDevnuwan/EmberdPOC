import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <nav class="sidebar">
        <div class="logo">EmberdPOC</div>
        <div class="nav-section">
          <div class="nav-header" (click)="masterOpen.set(!masterOpen())">
            Master Data {{ masterOpen() ? '▾' : '▸' }}
          </div>
          @if (masterOpen()) {
            <a routerLink="/master/users" routerLinkActive="active">Users</a>
            <a routerLink="/master/roles" routerLinkActive="active">Roles</a>
            <a routerLink="/master/products" routerLinkActive="active">Products</a>
            <a routerLink="/master/customers" routerLinkActive="active">Customers</a>
            <a routerLink="/master/insight-hub" routerLinkActive="active">Insight Hub</a>
          }
        </div>
        <a routerLink="/sales" routerLinkActive="active" class="nav-item">Sales</a>
        <div class="nav-section">
          <div class="nav-header" (click)="dashOpen.set(!dashOpen())">
            Dashboard Configuration {{ dashOpen() ? '▾' : '▸' }}
          </div>
          @if (dashOpen()) {
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Dashboard</a>
            <a routerLink="/dashboard/dataset" routerLinkActive="active">Dataset</a>
            <a routerLink="/dashboard/data-sources" routerLinkActive="active">Data Connectors</a>
            <a routerLink="/dashboard/hierarchy" routerLinkActive="active">Hierarchy</a>
            <a routerLink="/dashboard/filter" routerLinkActive="active">Filtering</a>
            <a routerLink="/access" routerLinkActive="active">Access</a>
          }
        </div>
        <div class="nav-section">
          <div class="nav-header" (click)="hardcodedOpen.set(!hardcodedOpen())">
            Dashboard (Hardcoded) {{ hardcodedOpen() ? '▾' : '▸' }}
          </div>
          @if (hardcodedOpen()) {
            <a routerLink="/hardcoded/insight-hub" routerLinkActive="active">Insight Hub</a>
            <a routerLink="/hardcoded/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Dashboard</a>
            <a routerLink="/hardcoded/dashboard/dataset" routerLinkActive="active">Dataset</a>
            <a routerLink="/hardcoded/dashboard/hierarchy" routerLinkActive="active">Hierarchy</a>
            <a routerLink="/hardcoded/dashboard/filter" routerLinkActive="active">Filtering</a>
            <a routerLink="/hardcoded/access" routerLinkActive="active">Access</a>
          }
        </div>
        <div class="spacer"></div>
        <div class="user-info">
          <span>{{ auth.user()?.fullName ?? 'User' }}</span>
          <button class="logout-btn" (click)="auth.logout()">Logout</button>
        </div>
      </nav>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; height:100vh; }
    .sidebar { width:220px; background:#1a1a2e; color:#fff; display:flex; flex-direction:column; padding:1rem 0; overflow-y:auto; flex-shrink:0; }
    .logo { padding:0 1rem 1rem; font-size:18px; font-weight:700; border-bottom:1px solid #333; margin-bottom:.5rem; }
    .nav-section { padding:0; }
    .nav-header { padding:8px 1rem; cursor:pointer; font-weight:500; color:#aaa; font-size:13px; text-transform:uppercase; }
    .nav-header:hover { color:#fff; }
    .sidebar a { display:block; padding:8px 1rem 8px 2rem; color:#ccc; text-decoration:none; font-size:14px; }
    .sidebar a:hover { background:#16213e; color:#fff; }
    .sidebar a.active { background:#0f3460; color:#fff; }
    .nav-item { padding:8px 1rem !important; }
    .spacer { flex:1; }
    .user-info { padding:1rem; border-top:1px solid #333; font-size:13px; }
    .user-info span { display:block; margin-bottom:6px; }
    .logout-btn { background:#e94560; color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:12px; }
    .content { flex:1; background:#f0f2f5; overflow:auto; padding:1.5rem; }
  `]
})
export class LayoutComponent {
  readonly auth = inject(AuthService);
  readonly masterOpen = signal(true);
  readonly dashOpen = signal(true);
  readonly hardcodedOpen = signal(true);
}
