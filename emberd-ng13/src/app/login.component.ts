import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { HOST_APP_NAME } from './host-info';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-wrap">
      <form class="login-card" (ngSubmit)="submit()">
        <h1>{{ appName }}</h1>
        <p class="muted">Sign in to the host application</p>
        <label>Username <input name="username" [(ngModel)]="username" autocomplete="username"></label>
        <label>Password <input name="password" type="password" [(ngModel)]="password" autocomplete="current-password"></label>
        <p class="error" *ngIf="error">{{ error }}</p>
        <button type="submit" class="primary" [disabled]="busy">{{ busy ? 'Signing in...' : 'Sign in' }}</button>
      </form>
    </div>
  `
})
export class LoginComponent {
  appName = HOST_APP_NAME;
  username = 'admin';
  password = 'admin123';
  busy = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.busy = true;
    this.error = '';
    this.auth.login(this.username, this.password).then(() => {
      this.busy = false;
      this.router.navigate(['/dashboards']);
    }, (e: any) => {
      this.busy = false;
      this.error = String((e && e.message) || e);
    });
  }
}
