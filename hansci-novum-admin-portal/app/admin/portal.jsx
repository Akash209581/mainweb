'use client';
import { useEffect, useState } from 'react';
import Dashboard from './dashboard';
import SettingsEditor from './settings/settings-editor';
import './style.css';
const RECORDS = [['all', 'Overview'], ['registration', 'Registrations'], ['abstract', 'Abstract submissions'], ['brochure', 'Brochure requests'], ['query', 'Queries']];
const SETTINGS = [['conference', 'Conference details', 'Conference details'], ['prices', 'Registration prices', 'Registration prices'], ['accommodation', 'Accommodation prices', 'Accommodation prices'], ['documents', 'Document uploads', 'Documents'], ['abstract-settings', 'Abstract settings', 'Abstract settings'], ['policies', 'Privacy & terms', 'Policies'], ['tracks', 'Scientific tracks', 'Scientific tracks'], ['committee', 'Organizing committee', 'Organizing committee']];
export default function Portal({ email }) {
    const [active, setActive] = useState('all'), [recordTab, setRecordTab] = useState('all'), [contentTab, setContentTab] = useState('Conference details');
    function navigate(id, updateUrl = true) { const setting = SETTINGS.find(s => s[0] === id); setActive(id); if (setting)
        setContentTab(setting[2]);
    else
        setRecordTab(id); if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('section', id);
        window.history.pushState({}, '', url.pathname + url.search);
    } }
    useEffect(() => { function read() { const id = new URL(window.location.href).searchParams.get('section') || 'all'; if ([...RECORDS, ...SETTINGS].some(s => s[0] === id))
        navigate(id, false); } read(); window.addEventListener('popstate', read); return () => window.removeEventListener('popstate', read); }, []);
    const content = SETTINGS.some(s => s[0] === active), label = content ? SETTINGS.find(s => s[0] === active)?.[1] : RECORDS.find(s => s[0] === active)?.[1];
    return <div className="admin unified-portal"><aside className="sidebar"><a className="adminbrand" href="/admin">HANSCI NOVUM<span>ADMIN PORTAL</span></a><div className="sidelabel">RECORDS & SUBMISSIONS</div><nav aria-label="Records & submissions">{RECORDS.map(([id, title]) => <button key={id} className={active === id ? 'selected' : ''} aria-current={active === id ? 'page' : undefined} onClick={() => navigate(id)}>{title}</button>)}</nav><div className="sidelabel contentlabel">CONTENT & SETTINGS</div><nav aria-label="Content & settings">{SETTINGS.map(([id, title]) => <button key={id} className={active === id ? 'selected' : ''} aria-current={active === id ? 'page' : undefined} onClick={() => navigate(id)}>{title}</button>)}</nav><div className="sidebottom"><span>Private administrator workspace</span><a href="/index.html" target="_blank" rel="noopener noreferrer">Open conference website ↗</a><a href="/api/auth/logout" target="_top">Sign out</a></div></aside><div className="workspace"><header className="adminheader"><div><span>Admin Portal</span><span className="portal-breadcrumb"> / {content ? 'Content & Settings' : 'Records & Submissions'} / {label}</span></div><span className="user">{email}</span></header><div hidden={content}><Dashboard activeTab={recordTab} onTabChange={id => navigate(id)}/></div><div hidden={!content}><SettingsEditor activeTab={contentTab}/></div></div></div>;
}
