import { env } from '../lib/storage';
import { INITIAL_TRACKS, INITIAL_COMMITTEE } from './content-defaults';
export const DEFAULTS = { conference: { title: 'Conference title to be confirmed', dates: 'Dates to be announced', venue: 'Venue to be confirmed', deadline: 'Submission deadline to be announced', supportEmail: '' }, registration: { label: 'Sample early-bird rates', note: 'Illustrative fee. Taxes are not configured; this is not a final payable total.', student: { EUR: 199, USD: 219, GBP: 179 }, academic: { EUR: 399, USD: 439, GBP: 359 }, industry: { EUR: 499, USD: 549, GBP: 449 } }, accommodation: { single: { EUR: 120, USD: 135, GBP: 105 }, double: { EUR: 160, USD: 180, GBP: 140 } }, abstract: { minWords: 500, maxWords: 600, maxFileMB: 5 }, policies: { privacy: 'Final conference privacy notice must be approved before collecting external submissions.', terms: 'Final submission, registration and refund terms must be approved before accepting external submissions.' }, assets: {}, tracks: INITIAL_TRACKS, committee: INITIAL_COMMITTEE };
export async function readSettings() { const row = await env.DB.prepare('SELECT value,updated_at FROM site_settings WHERE id=?').bind('conference').first(); return row ? { settings: { ...DEFAULTS, ...JSON.parse(row.value) }, version: row.updated_at } : { settings: DEFAULTS, version: null }; }
export function validateSettings(p) { if (!validateCollections(p))
    return false; if (!p || !p.conference || !p.registration || !p.accommodation || !p.abstract || !p.policies)
    return false; for (const k of ['title', 'dates', 'venue', 'deadline', 'supportEmail'])
    if (typeof p.conference[k] !== 'string' || p.conference[k].length > 500)
        return false; if (p.conference.supportEmail && !/^\S+@\S+\.\S+$/.test(p.conference.supportEmail))
    return false; for (const group of ['student', 'academic', 'industry'])
    for (const currency of ['EUR', 'USD', 'GBP'])
        if (!Number.isFinite(p.registration[group]?.[currency]) || p.registration[group][currency] < 0 || p.registration[group][currency] > 1000000)
            return false; for (const room of ['single', 'double'])
    for (const currency of ['EUR', 'USD', 'GBP'])
        if (!Number.isFinite(p.accommodation[room]?.[currency]) || p.accommodation[room][currency] < 0 || p.accommodation[room][currency] > 1000000)
            return false; const a = p.abstract; if (!Number.isInteger(a.minWords) || !Number.isInteger(a.maxWords) || a.minWords < 1 || a.maxWords < a.minWords || a.maxWords > 10000 || !Number.isInteger(a.maxFileMB) || a.maxFileMB < 1 || a.maxFileMB > 10)
    return false; return ['privacy', 'terms'].every(k => typeof p.policies[k] === 'string' && p.policies[k].length <= 20000) && typeof p.registration.label === 'string' && p.registration.label.length <= 200 && typeof p.registration.note === 'string' && p.registration.note.length <= 2000; }
export function validateCollections(p) { if (!p)
    return false; for (const kind of ['tracks', 'committee']) {
    if (p[kind] === undefined)
        continue;
    if (!Array.isArray(p[kind]) || p[kind].length > 200)
        return false;
    const ids = new Set();
    for (const item of p[kind]) {
        if (!item || typeof item.id !== 'string' || item.id.length > 100 || !item.id || ids.has(item.id) || typeof item.published !== 'boolean')
            return false;
        ids.add(item.id);
        const fields = kind === 'tracks' ? ['name', 'category', 'summary'] : ['name', 'role', 'group', 'affiliation', 'country', 'expertise', 'bio'];
        for (const field of fields)
            if (typeof item[field] !== 'string' || item[field].length > (field === 'bio' ? 10000 : 2000))
                return false;
        if (kind === 'tracks' && (!item.name.trim() || !Array.isArray(item.topics) || item.topics.length > 60 || item.topics.some((x) => typeof x !== 'string' || x.length > 500)))
            return false;
        if (kind === 'committee' && (typeof item.placeholder !== 'boolean' || (!item.placeholder && !item.name.trim()) || !item.role.trim()))
            return false;
    }
} return true; }
