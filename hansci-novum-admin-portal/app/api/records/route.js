import {validOrigin} from '../../../lib/request';
import { env } from '../../../lib/storage';
import { getChatGPTUser } from '../../chatgpt-auth';
import { readSettings } from '../../site-settings';
export const dynamic = 'force-dynamic';
const kinds = ['registration', 'abstract', 'brochure', 'query'];
const statuses = ['New', 'Under review', 'Accepted', 'Rejected', 'Contacted', 'Confirmed'];
const json = (v, status = 200) => Response.json(v, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() { const user = await getChatGPTUser(); if (!user)
    return json({ error: 'Sign in required' }, 401); const result = await env.DB.prepare('SELECT * FROM conference_records WHERE owner_id=? ORDER BY created_at DESC').bind(user.userId).all(); return json({ records: result.results.map((r) => ({ ...r, payload: JSON.parse(r.payload), file_key: undefined })) }); }
export async function POST(request) { const user = {userId:'conference'}; if (!validOrigin(request))
    return json({ error: 'Invalid origin' }, 403); let data; try {
    data = await request.formData();
}
catch {
    return json({ error: 'Invalid form' }, 400);
} let p; try {
    p = JSON.parse(String(data.get('payload')));
}
catch {
    return json({ error: 'Invalid record' }, 400);
} const kind = String(data.get('kind')); if (!kinds.includes(kind))
    return json({ error: 'Invalid record type' }, 400); if (JSON.stringify(p).length > 30000)
    return json({ error: 'Record too large' }, 400); const name = String(p.name || [p.first, p.last].filter(Boolean).join(' ')).trim(), email = String(p.email || '').trim(); if (!name || name.length > 200 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 200)
    return json({ error: 'A name and valid email are required' }, 400); const { settings } = await readSettings(); if (kind === 'registration') {
    const currency = ['EUR', 'USD', 'GBP'].includes(p.currency) ? p.currency : 'EUR';
    const category = ['student', 'academic', 'industry', 'exhibition', 'sponsorship', 'accommodation'].includes(p.category) ? p.category : 'academic';
    p.currency = currency;
    p.category = category;
    p.sampleRegistrationFee = settings.registration[category]?.[currency] || null;
    p.priceLabel = settings.registration.label;
    p.paymentStatus = 'Not processed';
    if (category === 'accommodation' || p.stay) {
        const nights = Math.round((Date.parse(p.checkout) - Date.parse(p.checkin)) / 86400000), rooms = Number(p.rooms);
        if (!Number.isInteger(nights) || nights < 1 || nights > 365 || !Number.isInteger(rooms) || rooms < 1 || rooms > 20)
            return json({ error: 'Check accommodation dates and room count' }, 400);
        p.sampleAccommodationSubtotal = nights * rooms * settings.accommodation[p.room === 'double' ? 'double' : 'single'][currency];
    }
    else
        p.sampleAccommodationSubtotal = 0;
} const f = data.get('document'); if (kind === 'abstract' && (!(f instanceof File) || !f.size))
    return json({ error: 'Abstract document required' }, 400); if (f instanceof File && (f.size > settings.abstract.maxFileMB * 1024 * 1024 || !/\.(pdf|doc|docx)$/i.test(f.name)))
    return json({ error: 'Use PDF or Word within the configured upload size' }, 400); const id = crypto.randomUUID(), now = new Date().toISOString(); let key = null, fileName = null; if (f instanceof File && f.size) {
    key = user.userId + '/' + id;
    fileName = f.name.slice(0, 240);
    await env.BUCKET.put(key, await f.arrayBuffer(), { httpMetadata: { contentType: 'application/octet-stream' } });
} try {
    await env.DB.prepare('INSERT INTO conference_records (id,owner_id,kind,status,name,email,phone,organisation,payload,file_key,file_name,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, user.userId, kind, 'New', name, email, String(p.phone || ''), String(p.institution || p.organisation || ''), JSON.stringify(p), key, fileName, '', now, now).run();
}
catch {
    if (key)
        await env.BUCKET.delete(key);
    return json({ error: 'Unable to save record. Please retry.' }, 500);
} return json({ ok: true, id, emailSent: false }, 201); }
export async function PATCH(request) { const user = await getChatGPTUser(); if (!user)
    return json({ error: 'Sign in required' }, 401); if (!validOrigin(request))
    return json({ error: 'Invalid origin' }, 403); let p; try {
    p = await request.json();
}
catch {
    return json({ error: 'Invalid update' }, 400);
} if (!statuses.includes(p.status) || String(p.notes || '').length > 10000)
    return json({ error: 'Invalid status or notes' }, 400); const result = await env.DB.prepare('UPDATE conference_records SET status=?,notes=?,updated_at=? WHERE id=? AND owner_id=?').bind(p.status, String(p.notes || ''), new Date().toISOString(), String(p.id), user.userId).run(); return result.meta.changes ? json({ ok: true }) : json({ error: 'Record not found' }, 404); }
