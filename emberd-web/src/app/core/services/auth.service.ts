import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  id: number;
  username: string;
  fullName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem('token'));
  readonly user = signal<LoginResponse | null>(null);
  readonly isLoggedIn = computed(() => !!this.token());

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await fetch(`${environment.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return false;
      const data: LoginResponse = await res.json();
      this.token.set(data.token);
      this.user.set(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }

  loadFromStorage(): void {
    const stored = localStorage.getItem('user');
    if (stored) this.user.set(JSON.parse(stored));
  }
}
