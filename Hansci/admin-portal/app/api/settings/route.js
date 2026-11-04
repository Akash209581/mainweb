import {validOrigin} from '../../../lib/request';
import { env } from '../../../lib/storage';
import { getChatGPTUser } from '../../chatgpt-auth';
import { getAdmin } from '../../admin-access';
import { readSettings, validateSettings } from '../../site-settings';
export const dynamic = 'force-dynamic';
const json = (d, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {  const { settings, version } = await readSettings(); const admin = await getAdmin(); if (!admin) {
    settings.tracks = (settings.tracks || []).filter((t) => t.published);
    settings.committee = (settings.committee || []).filter((m) => m.published);
} const assets = {}; for (const [k, v] of Object.entries(settings.assets || {}))
    assets[k] = { fileName: v.fileName, uploadedAt: v.uploadedAt }; return json({ settings: { ...settings, assets, committee: (settings.committee || []).map((m) => ({ ...m, photo: m.photo ? { url: '/api/assets?kind=committeePhoto&id=' + encodeURIComponent(m.id), fileName: m.photo.fileName } : null })) }, version }); }
export async function PUT(request) { if (!await getAdmin())
    return json({ error: 'Administrator access required' }, 403); if (!validOrigin(request))
    return json({ error: 'Invalid origin' }, 403); let p; try {
    p = await request.json();
}
catch {
    return json({ error: 'Invalid settings' }, 400);
} if (!validateSettings(p.settings))
    return json({ error: 'Check required fields, prices and abstract limits.' }, 400); const old = await readSettings(); if (p.version !== old.version)
    return json({ error: 'Settings changed in another session. Reload before saving.' }, 409); const value = { ...old.settings, ...p.settings, assets: old.settings.assets || {}, committee: (p.settings.committee || old.settings.committee || []).map((m) => ({ ...m, photo: (old.settings.committee || []).find((x) => x.id === m.id)?.photo || null })) }, version = new Date().toISOString(); if (old.version) {
    const result = await env.DB.prepare('UPDATE site_settings SET value=?,updated_at=? WHERE id=? AND updated_at=?').bind(JSON.stringify(value), version, 'conference', old.version).run();
    if (!result.meta.changes)
        return json({ error: 'Settings changed. Reload and retry.' }, 409);
}
else {
    try {
        await env.DB.prepare('INSERT INTO site_settings(id,value,updated_at) VALUES(?,?,?)').bind('conference', JSON.stringify(value), version).run();
    }
    catch {
        return json({ error: 'Settings were created elsewhere. Reload and retry.' }, 409);
    }
} return json({ ok: true, version }); }
export async function POST(request) { if (!await getAdmin())
    return json({ error: 'Administrator access required' }, 403); if (!validOrigin(request))
    return json({ error: 'Invalid origin' }, 403); const body = await request.formData(), kind = String(body.get('kind')), file = body.get('file'); if (!['sampleAbstract', 'brochure', 'committeePhoto'].includes(kind) || !(file instanceof File) || !file.size)
    return json({ error: 'Choose a document to upload.' }, 400); if (kind === 'committeePhoto') {
    if (file.size > 5 * 1024 * 1024 || !/\.(png|jpg|jpeg|webp)$/i.test(file.name))
        return json({ error: 'Choose PNG, JPEG or WebP, maximum 5 MB.' }, 400);
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const valid = (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) || (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) || (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP');
    if (!valid)
        return json({ error: 'The file is not a supported image.' }, 400);
} if (kind !== 'committeePhoto' && (file.size > 10 * 1024 * 1024 || !(kind === 'brochure' ? /\.pdf$/i : /\.(pdf|doc|docx|txt)$/i).test(file.name)))
    return json({ error: kind === 'brochure' ? 'Use a PDF, up to 10 MB.' : 'Use PDF, Word or TXT, up to 10 MB.' }, 400); const old = await readSettings(); if (String(body.get('version') || '') !== String(old.version || ''))
    return json({ error: 'Settings changed. Reload and retry.' }, 409); const memberId = String(body.get('memberId') || ''); if (kind === 'committeePhoto' && !(old.settings.committee || []).some((m) => m.id === memberId))
    return json({ error: 'Save the member before uploading a photograph.' }, 400); const key = 'site-assets/' + kind + '/' + crypto.randomUUID(), version = new Date().toISOString(); await env.BUCKET.put(key, await file.arrayBuffer()); const asset = { key, fileName: file.name.slice(0, 240), uploadedAt: version }; const value = kind === 'committeePhoto' ? { ...old.settings, committee: old.settings.committee.map((m) => m.id === memberId ? { ...m, photo: asset } : m) } : { ...old.settings, assets: { ...(old.settings.assets || {}), [kind]: asset } }; try {
    if (old.version) {
        const result = await env.DB.prepare('UPDATE site_settings SET value=?,updated_at=? WHERE id=? AND updated_at=?').bind(JSON.stringify(value), version, 'conference', old.version).run();
        if (!result.meta.changes) {
            await env.BUCKET.delete(key);
            return json({ error: 'Settings changed. Reload and retry.' }, 409);
        }
    }
    else
        await env.DB.prepare('INSERT INTO site_settings(id,value,updated_at) VALUES(?,?,?)').bind('conference', JSON.stringify(value), version).run();
}
catch {
    await env.BUCKET.delete(key);
    return json({ error: 'Unable to publish the file. Reload and retry.' }, 500);
} return json({ ok: true, version, fileName: file.name }); }
