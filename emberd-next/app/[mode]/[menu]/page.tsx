import { notFound } from 'next/navigation';
import { MenuPage } from '@/components/MenuPage';
import { MENUS, MODES, type Mode } from '@/lib/client';

export function generateStaticParams() {
  return MODES.flatMap(mode => MENUS.map(m => ({ mode, menu: m.slug })));
}

export default async function Page({ params }: { params: Promise<{ mode: string; menu: string }> }) {
  const { mode, menu } = await params;
  if (!MODES.includes(mode as Mode) || !MENUS.some(m => m.slug === menu)) notFound();
  return <MenuPage mode={mode as Mode} menu={menu} />;
}
