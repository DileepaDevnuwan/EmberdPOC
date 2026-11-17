import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const PACKAGE_DIR = path.join(process.cwd(), 'node_modules', '@osos-dashboard', 'elements');

const TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

type Ctx = { params: Promise<{ file: string[] }> };

export async function GET(_req: Request, ctx: Ctx) {
  const target = path.resolve(PACKAGE_DIR, ...(await ctx.params).file);
  if (!target.startsWith(PACKAGE_DIR + path.sep)) return new Response('Not found', { status: 404 });
  try {
    const content = await readFile(target);
    return new Response(content, {
      headers: {
        'Content-Type': TYPES[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
