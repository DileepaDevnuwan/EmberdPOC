'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';

const PROBE_TAG = 'osos-dashboard-viewer';

let licenceRegistered = false;

/** The bundled grids and charts read the product's Syncfusion licence; register it before any element renders. */
function registerLicenceOnce(): void {
  const key = process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE;
  const api = (globalThis as any).OsosDashboardElements;
  if (licenceRegistered || !key || !api?.registerSyncfusionLicense) return;
  api.registerSyncfusionLicense(key);
  licenceRegistered = true;
}

/** True once the bundle has defined its custom elements. */
export function useOsosReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const markReady = () => {
      registerLicenceOnce();
      setReady(true);
    };
    if (customElements.get(PROBE_TAG) && (globalThis as any).OsosDashboardElements) {
      markReady();
      return;
    }
    const on = markReady;
    document.addEventListener('osos-dashboard-ready', on);
    customElements.whenDefined(PROBE_TAG).then(on);
    return () => document.removeEventListener('osos-dashboard-ready', on);
  }, []);
  return ready;
}

type Props = {
  tag: string;
  /** Element properties (not attributes). Required ones are set before the element is appended. */
  props?: Record<string, unknown>;
  /** Output name -> handler(detail, element). Names are fixed when the element is created. */
  events?: Record<string, (detail: any, el: HTMLElement) => void>;
  onElement?: (el: HTMLElement | null) => void;
};

/** Creates one Dashboard custom element imperatively and keeps its properties in sync. */
export function OsosElement({ tag, props = {}, events = {}, onElement }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const el = useRef<any>(null);
  const applied = useRef<Record<string, unknown>>({});
  const eventsRef = useRef(events);
  const propsRef = useRef(props);
  const onElementRef = useRef(onElement);
  useEffect(() => {
    eventsRef.current = events;
    propsRef.current = props;
    onElementRef.current = onElement;
  });
  const ready = useOsosReady();
  const eventNames = Object.keys(events).sort().join(',');

  useEffect(() => {
    const container = host.current;
    if (!ready || !container) return;
    const node: any = document.createElement(tag);
    Object.assign(node, propsRef.current);
    applied.current = { ...propsRef.current };
    const handlers = eventNames
      .split(',')
      .filter(Boolean)
      .map(name => {
        const h = (e: Event) => eventsRef.current[name]?.((e as CustomEvent).detail, node);
        node.addEventListener(name, h);
        return [name, h] as const;
      });
    container.appendChild(node);
    el.current = node;
    onElementRef.current?.(node);
    return () => {
      handlers.forEach(([n, h]) => node.removeEventListener(n, h));
      node.remove();
      el.current = null;
      onElementRef.current?.(null);
    };
  }, [ready, tag, eventNames]);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    for (const [k, v] of Object.entries(props)) {
      if (applied.current[k] !== v) {
        node[k] = v;
        applied.current[k] = v;
      }
    }
  });

  return (
    <div ref={host} className="osos-host">
      {!ready && <p className="muted">Loading Dashboard bundle...</p>}
    </div>
  );
}
