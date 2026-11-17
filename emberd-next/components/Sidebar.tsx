'use client';
import { usePathname } from 'next/navigation';
import { MENUS } from '@/lib/client';

const GROUPS = [
  { mode: 'live', label: 'Live', hint: 'Dashboard.Web :5150' },
  { mode: 'hardcoded', label: 'Hardcoded', hint: 'POC JSON store :5300' },
  { mode: 'remote', label: 'java01 (bundle)', hint: 'public/osos-dashboard' },
  { mode: 'remote-npm', label: 'java01 (npm)', hint: '@osos-dashboard/elements' },
] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <nav className="sidebar">
      <div className="brand">Emberd Next</div>
      {GROUPS.map(g => (
        <div key={g.mode} className="group">
          <div className="group-title">
            {g.label} <small>{g.hint}</small>
          </div>
          {MENUS.map(m => {
            const href = `/${g.mode}/${m.slug}`;
            return (
              <a key={href} href={href} className={path === href ? 'active' : undefined}>
                {m.label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
