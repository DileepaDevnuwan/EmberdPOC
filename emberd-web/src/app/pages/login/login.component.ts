import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>EmberdPOC Login</h2>
        <form (ngSubmit)="onLogin()">
          <div class="field">
            <label>Username</label>
            <input [(ngModel)]="username" name="username" placeholder="admin" />
          </div>
          <div class="field">
            <label>Password</label>
            <input [(ngModel)]="password" name="password" type="password" placeholder="admin123" />
          </div>
          @if (error()) { <p class="error">{{ error() }}</p> }
          <button type="submit" [disabled]="loading()">{{ loading() ? 'Logging in...' : 'Login' }}</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container { display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f2f5; }
    .login-card { background:#fff; padding:2rem; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.15); width:360px; }
    h2 { margin:0 0 1.5rem; text-align:center; color:#1a1a2e; }
    .field { margin-bottom:1rem; }
    .field label { display:block; margin-bottom:4px; font-weight:500; color:#333; }
    .field input { width:100%; padding:8px 12px; border:1px solid #d9d9d9; border-radius:4px; font-size:14px; box-sizing:border-box; }
    button { width:100%; padding:10px; background:#1890ff; color:#fff; border:none; border-radius:4px; font-size:15px; cursor:pointer; }
    button:disabled { opacity:.6; }
    .error { color:#ff4d4f; font-size:13px; margin:0 0 .5rem; }
  `]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = 'admin';
  password = 'admin123';
  error = signal('');
  loading = signal(false);

  async onLogin() {
    this.loading.set(true);
    this.error.set('');
    const ok = await this.auth.login(this.username, this.password);
    this.loading.set(false);
    if (ok) this.router.navigate(['/']);
    else this.error.set('Invalid username or password');
  }
}
