import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { OSOS_API } from './osos.config';

export interface EmbedError {
  status: number;
  error: any;
}

function parse(text: string): any {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

@Injectable()
export class EmbedApiService {
  constructor(private auth: AuthService) {}

  raw(path: string, method?: string, body?: any): Promise<Response> {
    const headers: { [key: string]: string } = {};
    const token = this.auth.token;
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    const init: RequestInit = { method: method || 'GET', headers: headers };
    if (body !== undefined && body !== null && init.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const url = OSOS_API.embedPrefix + (path.charAt(0) === '/' ? path : '/' + path);
    return fetch(url, init);
  }

  call(path: string, method?: string, body?: any): Promise<any> {
    const verb = method || 'GET';
    return this.raw(path, verb, body).then(function (res) {
      return res.text().then(function (text) {
        if (!res.ok) {
          console.warn('[host] ' + verb + ' ' + path + ' -> ' + res.status, text.slice(0, 300));
          const err: EmbedError = { status: res.status, error: parse(text) };
          throw err;
        }
        return parse(text);
      });
    });
  }
}

export function describeError(e: any): string {
  return e && e.status ? e.status + ' ' + JSON.stringify(e.error) : String(e);
}
