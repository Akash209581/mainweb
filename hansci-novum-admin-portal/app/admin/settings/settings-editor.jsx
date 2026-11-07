'use client';

import { useState, useEffect } from 'react';
import '../style.css';
import ContentLists from './content-lists';

export default function SettingsEditor({ activeTab = 'Conference details' }) {
  const [config, setConfig] = useState(null),
    [version, setVersion] = useState(null),
    [tab, setTab] = useState('Conference details'),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);

  const tabs = [
    'Conference details',
    'Registration prices',
    'Accommodation prices',
    'Documents',
    'Abstract settings',
    'Policies',
    'Scientific tracks',
    'Organizing committee',
    'Featured speakers',
    'Homepage sections'
  ];

  useEffect(() => {
    setTab(activeTab);
  }, [activeTab]);

  async function load() {
    setError('');
    try {
      const r = await fetch('/api/settings', { cache: 'no-store' }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setConfig(d.settings);
      setVersion(d.version);
      setDirty(false);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(path, value) {
    setConfig((c) => {
      const copy = structuredClone(c);
      let x = copy;
      path.slice(0, -1).forEach((k) => {
        if (!x[k]) x[k] = {};
        x = x[k];
      });
      x[path[path.length - 1]] = value;
      return copy;
    });
    setDirty(true);
    setNotice('');
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: config, version })
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setVersion(d.version);
      setDirty(false);
      setNotice('Settings published successfully. Refresh the conference pages to see your changes.');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function upload(e, kind) {
    e.preventDefault();
    if (dirty) {
      setError('Save your other changes before uploading a document.');
      return;
    }
    const form = e.currentTarget,
      body = new FormData(form);
    body.set('kind', kind);
    body.set('version', version || '');
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/settings', { method: 'POST', body });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
      form.reset();
      setNotice('Document uploaded and its download link updated.');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(e, id, photoKind = 'committeePhoto') {
    if (dirty) {
      setError('Save your changes before uploading a photograph.');
      return;
    }
    setBusy(true);
    setError('');
    const body = new FormData();
    body.set('kind', photoKind);
    body.set(photoKind === 'speakerPhoto' ? 'speakerId' : 'memberId', id);
    body.set('version', version || '');
    body.set('file', e.currentTarget.photoFile);
    try {
      const r = await fetch('/api/settings', { method: 'POST', body });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
      setNotice(
        `${photoKind === 'speakerPhoto' ? 'Speaker' : 'Committee member'} photograph uploaded. Refresh the website to see it.`
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="embedded-settings">
      <main>
        <div className="pageheading">
          <div>
            <div className="eyebrow">WEBSITE MANAGEMENT</div>
            <h1>{tab}</h1>
            <p>Manage your conference content with immediate end-to-end publishing.</p>
          </div>
          <span className="badge">{dirty ? 'Unsaved changes' : version ? 'Saved' : 'Default settings'}</span>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}

        {!config ? (
          <p>Loading settings…</p>
        ) : (
          <>
            {tab === 'Documents' ? (
              <div className="settingsdocuments">
                {[
                  ['sampleAbstract', 'Sample abstract', 'PDF, DOC, DOCX or TXT'],
                  ['brochure', 'Conference brochure', 'PDF only']
                ].map(([kind, title, types]) => (
                  <section className="settingspanel" key={kind}>
                    <h2>{title}</h2>
                    <p>Current file: {config.assets[kind]?.fileName || 'No file uploaded'}</p>
                    {config.assets[kind] && (
                      <a className="filedownload" href={'/api/assets?kind=' + kind}>
                        Download current file ↓
                      </a>
                    )}
                    <form onSubmit={(e) => upload(e, kind)}>
                      <label>
                        Choose replacement document
                        <input
                          name="file"
                          type="file"
                          accept={kind === 'brochure' ? '.pdf' : '.pdf,.doc,.docx,.txt'}
                          required
                        />
                      </label>
                      <p className="footnote">
                        {types} · maximum 10 MB. Uploading publishes the new download immediately.
                      </p>
                      <button className="export" disabled={busy || dirty}>
                        {busy ? 'Uploading…' : 'Upload & publish'}
                      </button>
                    </form>
                  </section>
                ))}
              </div>
            ) : (
              <form onSubmit={save} className="settingspanel">
                <div className="settingsfields">
                  {(tab === 'Scientific tracks' || tab === 'Organizing committee' || tab === 'Featured speakers') && (
                    <ContentLists
                      kind={
                        tab === 'Scientific tracks'
                          ? 'tracks'
                          : tab === 'Organizing committee'
                          ? 'committee'
                          : 'speakers'
                      }
                      items={
                        config[
                          tab === 'Scientific tracks'
                            ? 'tracks'
                            : tab === 'Organizing committee'
                            ? 'committee'
                            : 'speakers'
                        ] || []
                      }
                      onChange={(items) =>
                        edit(
                          [
                            tab === 'Scientific tracks'
                              ? 'tracks'
                              : tab === 'Organizing committee'
                              ? 'committee'
                              : 'speakers'
                          ],
                          items
                        )
                      }
                      dirty={dirty}
                      busy={busy}
                      onPhoto={uploadPhoto}
                    />
                  )}

                  {tab === 'Conference details' &&
                    [
                      ['title', 'Conference title'],
                      ['dates', 'Conference dates (display text)'],
                      ['venue', 'Venue / location'],
                      ['deadline', 'Abstract deadline (display text)'],
                      ['supportEmail', 'Support email (optional)'],
                      ['phone', 'Secretariat phone number (optional)']
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          required={key !== 'supportEmail' && key !== 'phone'}
                          type={key === 'supportEmail' ? 'email' : 'text'}
                          maxLength={500}
                          value={config.conference?.[key] || ''}
                          onChange={(e) => edit(['conference', key], e.target.value)}
                        />
                      </label>
                    ))}

                  {tab === 'Registration prices' && (
                    <>
                      <label>
                        Rate label
                        <input
                          maxLength={200}
                          value={config.registration?.label || ''}
                          onChange={(e) => edit(['registration', 'label'], e.target.value)}
                        />
                      </label>
                      <p className="footnote">
                        Prices are independent amounts in each currency. Saving updates all registration forms and pricing cards.
                      </p>
                      {['student', 'academic', 'industry'].map((category) => (
                        <fieldset key={category}>
                          <legend>
                            {category === 'academic'
                              ? 'Academic delegate'
                              : category === 'industry'
                              ? 'Industry delegate'
                              : 'Student'}
                          </legend>
                          <div className="currencyprices">
                            {['EUR', 'USD', 'GBP'].map((c) => (
                              <label key={c}>
                                {c}
                                <input
                                  required
                                  type="number"
                                  min={0}
                                  max={1000000}
                                  step="0.01"
                                  value={config.registration?.[category]?.[c] ?? ''}
                                  onChange={(e) =>
                                    edit(['registration', category, c], Number(e.target.value))
                                  }
                                />
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ))}
                      <label>
                        Pricing note
                        <textarea
                          rows={3}
                          value={config.registration?.note || ''}
                          onChange={(e) => edit(['registration', 'note'], e.target.value)}
                          maxLength={2000}
                        />
                      </label>
                    </>
                  )}

                  {tab === 'Accommodation prices' && (
                    <>
                      <p className="footnote">Per room, per night. Updates hotel stay calculation on registration forms.</p>
                      {['single', 'double'].map((room) => (
                        <fieldset key={room}>
                          <legend>{room === 'single' ? 'Single room' : 'Double / twin room'}</legend>
                          <div className="currencyprices">
                            {['EUR', 'USD', 'GBP'].map((c) => (
                              <label key={c}>
                                {c}
                                <input
                                  required
                                  type="number"
                                  min={0}
                                  max={1000000}
                                  step="0.01"
                                  value={config.accommodation?.[room]?.[c] ?? ''}
                                  onChange={(e) =>
                                    edit(['accommodation', room, c], Number(e.target.value))
                                  }
                                />
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ))}
                    </>
                  )}

                  {tab === 'Abstract settings' &&
                    [
                      ['minWords', 'Minimum words', 1, 10000],
                      ['maxWords', 'Maximum words', config.abstract?.minWords || 100, 10000],
                      ['maxFileMB', 'Maximum upload size (MB)', 1, 50]
                    ].map(([key, label, min, max]) => (
                      <label key={String(key)}>
                        {label}
                        <input
                          required
                          type="number"
                          step={1}
                          min={Number(min)}
                          max={Number(max)}
                          value={config.abstract?.[key] ?? ''}
                          onChange={(e) => edit(['abstract', String(key)], Number(e.target.value))}
                        />
                      </label>
                    ))}

                  {tab === 'Abstract settings' && (
                    <p className="footnote">
                      Word limits appear in submission guidelines and are enforced dynamically on the abstract submission page.
                    </p>
                  )}

                  {tab === 'Policies' &&
                    ['privacy', 'terms'].map((k) => (
                      <label key={k}>
                        {k === 'privacy' ? 'Privacy notice' : 'Registration / submission terms'}
                        <textarea
                          rows={10}
                          maxLength={20000}
                          value={config.policies?.[k] || ''}
                          onChange={(e) => edit(['policies', k], e.target.value)}
                        />
                      </label>
                    ))}

                  {tab === 'Homepage sections' && (
                    <div className="homepage-sections-editor" style={{ width: '100%', gridColumn: '1 / -1' }}>
                      <p className="footnote" style={{ marginBottom: 18 }}>
                        Edit headlines, badges, descriptions, statistics and visibility for all homepage sections.
                      </p>
                      {(config.sections || []).map((section, sIdx) => (
                        <details
                          key={section.id || sIdx}
                          className="content-item"
                          style={{ marginBottom: 16 }}
                          open={sIdx === 0}
                        >
                          <summary style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <b>{section.name || section.id?.toUpperCase()} SECTION</b>
                            <span className="badge">{section.visible !== false ? 'Visible' : 'Hidden'}</span>
                          </summary>
                          <div style={{ padding: 16, border: '1px solid #e2e8f0', borderTop: 'none', background: '#fff', borderRadius: '0 0 6px 6px' }}>
                            <label className="content-check" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                type="checkbox"
                                checked={section.visible !== false}
                                onChange={(e) => {
                                  const next = [...(config.sections || [])];
                                  next[sIdx] = { ...section, visible: e.target.checked };
                                  edit(['sections'], next);
                                }}
                              />
                              Show this section on homepage
                            </label>
                            <div className="settingsfields">
                              {Object.entries(section.fields || {}).map(([fKey, fVal]) => (
                                <label key={fKey}>
                                  <span style={{ textTransform: 'capitalize' }}>
                                    {fKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                                  </span>
                                  {fKey.includes('paragraph') || fKey.includes('description') ? (
                                    <textarea
                                      rows={4}
                                      value={fVal || ''}
                                      onChange={(e) => {
                                        const next = [...(config.sections || [])];
                                        next[sIdx] = {
                                          ...section,
                                          fields: { ...section.fields, [fKey]: e.target.value }
                                        };
                                        edit(['sections'], next);
                                      }}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={fVal || ''}
                                      onChange={(e) => {
                                        const next = [...(config.sections || [])];
                                        next[sIdx] = {
                                          ...section,
                                          fields: { ...section.fields, [fKey]: e.target.value }
                                        };
                                        edit(['sections'], next);
                                      }}
                                    />
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>

                <div className="settingsactions">
                  <button className="export" disabled={busy || !dirty}>
                    {busy ? 'Saving…' : 'Save & publish settings'}
                  </button>
                  <button
                    type="button"
                    className="plainbutton"
                    disabled={busy}
                    onClick={() => {
                      if (!dirty || confirm('Discard unsaved changes and reload saved settings?'))
                        load();
                    }}
                  >
                    Reload saved settings
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        <p className="footnote">
          Changes update this conference portal and public website immediately.
        </p>
      </main>
    </div>
  );
}
