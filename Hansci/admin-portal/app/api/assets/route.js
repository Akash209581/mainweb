import { env } from '../../../lib/storage';
import { getAdmin } from '../../admin-access';
import { readSettings } from '../../site-settings';
export const dynamic = 'force-dynamic';
export async function GET(request) {  const kind = new URL(request.url).searchParams.get('kind') || ''; if (!['sampleAbstract', 'brochure', 'committeePhoto'].includes(kind))
    return new Response('Not found', { status: 404 }); const { settings } = await readSettings(); if(kind==='committeePhoto'){const m=(settings.committee||[]).find(x=>x.id===new URL(request.url).searchParams.get('id'));if(!m||(!m.published&&!await getAdmin()))return new Response('Not found',{status:404});}const asset = kind === 'committeePhoto' ? (settings.committee || []).find((m) => m.id === new URL(request.url).searchParams.get('id'))?.photo : settings.assets?.[kind]; if (!asset)
    return new Response('Document not yet uploaded', { status: 404 }); const object = await env.BUCKET.get(asset.key); if (!object)
    return new Response('Not found', { status: 404 }); const mime = kind === 'committeePhoto' ? (/\.png$/i.test(asset.fileName) ? 'image/png' : /\.webp$/i.test(asset.fileName) ? 'image/webp' : 'image/jpeg') : 'application/octet-stream'; return new Response(object.body, { headers: { 'Content-Type': mime, 'Content-Disposition': (kind === 'committeePhoto' ? "inline; filename*=UTF-8''" : "attachment; filename*=UTF-8''") + encodeURIComponent(asset.fileName), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
