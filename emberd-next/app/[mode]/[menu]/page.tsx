import { notFound } from 'next/navigation';
import { MenuPage } from '@/components/MenuPage';
import { MENUS, type Mode } from '@/lib/client';

export function generateStaticParams() {
  return (['live', 'hardcoded'] as const).flatMap(mode => MENUS.map(m => ({ mode, menu: m.slug })));
}

export default async function Page({ params }: { params: Promise<{ mode: string; menu: string }> }) {
  const { mode, menu } = await params;
  if ((mode !== 'live' && mode !== 'hardcoded') || !MENUS.some(m => m.slug === menu)) notFound();
  return <MenuPage mode={mode as Mode} menu={menu} />;
}
