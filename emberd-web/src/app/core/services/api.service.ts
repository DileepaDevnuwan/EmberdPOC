import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly auth = inject(AuthService);
  private readonly baseUrl = environment.apiUrl;

  private headers(): HeadersInit {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.auth.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    if (res.status === 401) { this.auth.logout(); throw new Error('Unauthorized'); }
    return res.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    if (res.status === 401) { this.auth.logout(); throw new Error('Unauthorized'); }
    return res.json();
  }

  async put(path: string, body: unknown): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
    if (res.status === 401) { this.auth.logout(); throw new Error('Unauthorized'); }
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE', headers: this.headers() });
    if (res.status === 401) { this.auth.logout(); throw new Error('Unauthorized'); }
  }
}
