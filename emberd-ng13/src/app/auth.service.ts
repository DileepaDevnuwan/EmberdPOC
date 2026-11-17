import { Injectable } from '@angular/core';
import { OSOS_API } from './osos.config';

const TOKEN_KEY = 'emberd.host.token';

@Injectable()
export class AuthService {
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  login(username: string, password: string): Promise<void> {
    return fetch(OSOS_API.loginPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('Login failed (' + res.status + ')');
      }
      return res.json();
    }).then(function (json) {
      localStorage.setItem(TOKEN_KEY, json.token);
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
