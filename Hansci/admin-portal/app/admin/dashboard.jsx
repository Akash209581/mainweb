'use client';
import { useEffect, useState, useRef } from 'react';
import './style.css';
const TYPES = [['all', 'Overview'], ['registration', 'Registrations'], ['abstract', 'Abstract submissions'], ['brochure', 'Brochure requests'], ['query', 'Queries']];
export default function Dashboard({ activeTab = "all", onTabChange }) {
    const [rows, setRows] = useState([]), [tab, setTab] = useState('all'), [search, setSearch] = useState(''), [status, setStatus] = useState('All statuses'), [loading, setLoading] = useState(true), [error, setError] = useState(''), [record, setRecord] = useState(null), [saving, setSaving] = useState(false), [notice, setNotice] = useState('');
    const dialog = useRef(null);
    async function refresh() { setLoading(true); setError(''); try {
        const r = await fetch('/api/records', { cache: 'no-store' });
        const d = await r.json();
        if (!r.ok)
            throw Error(d.error || 'Unable to load records');
        setRows(d.records);
    }
    catch (e) {
        setError(String(e));
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { refresh(); }, []);
    useEffect(() => { if (record)
        dialog.current?.showModal(); }, [record?.id]);
    useEffect(() => { setTab(activeTab); setSearch(''); setStatus('All statuses'); }, [activeTab]);
    const filtered = rows.filter(r => (tab === 'all' || r.kind === tab) && (status === 'All statuses' || r.status === status) && `${r.name} ${r.email} ${r.organisation} ${JSON.stringify(r.payload)}`.toLowerCase().includes(search.toLowerCase()));
    function exportCSV() { const safe = (v) => { let s = String(v ?? ''); if (/^[=+@\-\t\r]/.test(s))
        s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; }; const fields = ['kind', 'name', 'email', 'phone', 'organisation', 'status', 'created_at', 'file_name', 'notes']; const csv = [fields.join(','), ...filtered.map(r => fields.map(f => safe(r[f])).join(','))].join('\r\n'); const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'hansci-novum-' + tab + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    async function save(e) { e.preventDefault(); if (!record)
        return; setSaving(true); setError(''); try {
        const r = await fetch('/api/records', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: record.id, status: record.status, notes: record.notes }) });
        const d = await r.json();
        if (!r.ok)
            throw Error(d.error);
        setRows(all => all.map(x => x.id === record.id ? record : x));
        dialog.current?.close();
        setRecord(null);
        setNotice('Record updated successfully.');
    }
    catch (e) {
        setError(String(e));
    }
    finally {
        setSaving(false);
    } }
    return <div className="embedded-records"><main><div className="pageheading"><div><div className="eyebrow">CONFERENCE OPERATIONS</div><h1>{TYPES.find(x => x[0] === tab)?.[1]}</h1><p>Your submissions and participant records, together in one place.</p></div><button className="export" onClick={exportCSV} disabled={!filtered.length}>Export CSV ↓</button></div><div className="metrics">{TYPES.slice(1).map(([id, label]) => <button key={id} onClick={() => { setTab(id); onTabChange?.(id); }}><span>{label}</span><b>{rows.filter(r => r.kind === id).length}</b><small>{rows.filter(r => r.kind === id && r.status === 'New').length} awaiting action</small></button>)}</div><div className="connection"><b>Connected record storage</b><span>Records and abstract documents are saved securely. Payment processing and email delivery are not connected.</span></div>{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}<section className="records"><div className="recordstop"><h2>{tab === 'all' ? 'All records' : TYPES.find(x => x[0] === tab)?.[1]}</h2><button onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh ↻'}</button></div><div className="filters"><label>Search records<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, institution or topic…"/></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}>{['All statuses', 'New', 'Under review', 'Accepted', 'Rejected', 'Contacted', 'Confirmed'].map(s => <option key={s}>{s}</option>)}</select></label></div><div className="recordcount">{filtered.length} matching records</div>{loading ? <div className="empty">Loading records…</div> : !filtered.length ? <div className="empty"><div className="emptymark">+</div><h3>{rows.length ? 'No matching records' : 'Your conference workspace is ready.'}</h3><p>{rows.length ? 'Try a different search or status.' : 'New registrations, abstract submissions, brochure requests and queries will appear here. No demo records have been added.'}</p><a href="/index.html" target="_blank">Open conference forms ↗</a></div> : <div className="tablewrap"><table><thead><tr><th>Name / organisation</th><th>Record type</th><th>Email</th><th>Status</th><th>Received</th><th></th></tr></thead><tbody>{filtered.map(r => <tr key={r.id}><td><b>{r.name}</b><small>{r.organisation || '—'}</small></td><td className="capitalize">{r.kind}</td><td>{r.email}</td><td><span className={'badge status-' + r.status.toLowerCase().replace(' ', '-')}>{r.status}</span></td><td>{new Date(r.created_at).toLocaleDateString('en-GB')}</td><td><button onClick={() => { setError(''); setRecord({ ...r }); }}>View →</button></td></tr>)}</tbody></table></div>}</section><p className="footnote">Changing a registration status does not verify payment. Abstract acceptance and email notifications are managed separately.</p></main>{record && <dialog ref={dialog} className="detail" onCancel={() => setRecord(null)} aria-labelledby="detail-title"><div className="detailhead"><div><span className="eyebrow capitalize">{record.kind} record</span><h2 id="detail-title">{record.name}</h2></div><button onClick={() => { dialog.current?.close(); setRecord(null); }}>Close</button></div><div className="detailsgrid">{[['Email', record.email], ['Phone', record.phone], ['Institution', record.organisation], ['Received', new Date(record.created_at).toLocaleString('en-GB')]].map(([k, v]) => <div key={k}><small>{k}</small><p>{v || 'Not provided'}</p></div>)}</div>{record.file_name && <a className="filedownload" href={'/api/files?id=' + encodeURIComponent(record.id)}>Download abstract: {record.file_name} ↓</a>}<details className="submissiondetails" open><summary>Submission details</summary><dl>{Object.entries(record.payload).filter(([k]) => !['captcha', 'first', 'last', 'email', 'phone', 'institution'].includes(k)).map(([k, v]) => <div key={k}><dt>{k.replace(/([A-Z])/g, ' $1')}</dt><dd>{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}</dd></div>)}</dl></details><form onSubmit={save}><div className="editfields"><label>Workflow status<select value={record.status} onChange={e => setRecord({ ...record, status: e.target.value })}>{['New', 'Under review', 'Accepted', 'Rejected', 'Contacted', 'Confirmed'].map(x => <option key={x}>{x}</option>)}</select></label><label>Internal notes<textarea rows={4} maxLength={10000} value={record.notes} onChange={e => setRecord({ ...record, notes: e.target.value })}/></label></div>{error && <p className="error" role="alert">{error}</p>}<button className="export save" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></form></dialog>}</div>;
}
