import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Emberd Next',
  description: 'OSOS Dashboard as Web Components in a Next.js host',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* The OSOS Dashboard Web Components bundle, loaded once for every page. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/osos-dashboard/styles.css" />
        <script type="module" src="/osos-dashboard/main.js" async />
      </head>
      <body>
        <div className="shell">
          <Sidebar />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
