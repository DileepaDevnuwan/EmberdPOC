'use client';
import { useEffect } from 'react';

export function BundleLoader({ base }: { base: string }) {
  useEffect(() => {
    if (document.querySelector('script[data-osos-bundle]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${base}/styles.css`;
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `${base}/main.js`;
    script.dataset.ososBundle = base;
    document.head.appendChild(script);
  }, [base]);
  return null;
}
