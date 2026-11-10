'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import type { Mode } from '@/lib/client';

/**
 * Answers every `osos-request` the Dashboard screens send by forwarding it to this app's back end
 * (`/api/dash/<mode>`), which calls the Dashboard API server-to-server. The reply is the raw API JSON.
 */
export function HostBridge({ mode }: { mode: Mode }) {
  useEffect(() => {
    const onRequest = (event: Event) => {
      const { call, method = 'GET', path, body, reply } = (event as CustomEvent).detail ?? {};
      if (!path || typeof reply !== 'function') return;
      const isDownload = typeof call === 'string' && call.endsWith('.download');
      const init: RequestInit = { method };
      if (body !== undefined && body !== null && method !== 'GET') {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = JSON.stringify(body);
      }
      reply(
        fetch(`/api/dash/${mode}${path}`, init).then(async res => {
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.warn(`[host] ${call} ${method} ${path} -> ${res.status}`, text.slice(0, 300));
            throw { status: res.status, error: safeJson(text) };
          }
          if (isDownload) return res;
          const text = await res.text();
          return text ? safeJson(text) : null;
        })
      );
    };
    document.addEventListener('osos-request', onRequest);
    return () => document.removeEventListener('osos-request', onRequest);
  }, [mode]);
  return null;
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
