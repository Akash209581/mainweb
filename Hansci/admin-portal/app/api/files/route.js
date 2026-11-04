import { env } from '../../../lib/storage';
import { getChatGPTUser } from '../../chatgpt-auth';
export const dynamic = 'force-dynamic';
export async function GET(request) { const user = await getChatGPTUser(); if (!user)
    return new Response('Sign in required', { status: 401 }); const id = new URL(request.url).searchParams.get('id'); const record = await env.DB.prepare('SELECT file_key,file_name FROM conference_records WHERE id=? AND owner_id=?').bind(id, user.userId).first(); if (!record?.file_key)
    return new Response('Not found', { status: 404 }); const object = await env.BUCKET.get(record.file_key); if (!object)
    return new Response('Not found', { status: 404 }); return new Response(object.body, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(record.file_name), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
