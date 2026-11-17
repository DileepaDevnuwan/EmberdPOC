import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { OSOS_NAV } from './osos.config';
import { HOST_APP_NAME } from './host-info';

@Component({
  selector: 'app-shell',
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">{{ appName }}</div>
        <nav>
          <a *ngFor="let item of nav" [routerLink]="item.link" routerLinkActive="active">{{ item.label }}</a>
        </nav>
        <button class="link logout" (click)="logout()">Sign out</button>
      </aside>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class ShellComponent {
  nav = OSOS_NAV;
  appName = HOST_APP_NAME;

  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
