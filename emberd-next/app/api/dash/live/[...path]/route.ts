import { proxyDash } from '@/lib/dash-proxy';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path: string[] }> };
const handle = async (req: Request, ctx: Ctx) => proxyDash('live', req, (await ctx.params).path);

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
