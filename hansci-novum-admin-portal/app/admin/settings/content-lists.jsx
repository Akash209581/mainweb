'use client';

export default function ContentLists({ kind, items, onChange, dirty, busy, onPhoto }) {
  const members = kind === 'committee';
  const isSpeakers = kind === 'speakers';

  function edit(id, key, value) {
    onChange(items.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  }

  function move(index, direction) {
    const next = [...items];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  }

  function add() {
    if (members) {
      onChange([
        ...items,
        {
          id: crypto.randomUUID(),
          name: '',
          role: 'Committee Member',
          group: 'Organizing committee',
          affiliation: '',
          country: '',
          expertise: '',
          bio: '',
          placeholder: false,
          published: false,
          photo: null
        }
      ]);
    } else if (isSpeakers) {
      onChange([
        ...items,
        {
          id: 'sp-' + crypto.randomUUID().slice(0, 8),
          name: 'New Featured Speaker',
          role: 'Keynote Speaker',
          organizationName: 'Global Technology Institute',
          topic: 'Emerging Frontiers in Global Innovation',
          bio: '',
          published: true,
          photo: null
        }
      ]);
    } else {
      onChange([
        ...items,
        {
          id: crypto.randomUUID(),
          name: 'New scientific track',
          category: 'General',
          summary: '',
          topics: [],
          published: false
        }
      ]);
    }
  }

  const titleText = members
    ? 'Organizing committee members'
    : isSpeakers
    ? 'Featured speakers & keynotes'
    : 'Scientific tracks & sessions';

  const addText = members ? 'member' : isSpeakers ? 'speaker' : 'track';

  const previewHref = members ? '/committee' : isSpeakers ? '/speakers' : '/sessions';

  return (
    <>
      <div className="list-toolbar">
        <div>
          <h2>{titleText}</h2>
          <p>
            {items.length} entries · {items.filter((x) => x.published).length} published. Order below controls website order.
          </p>
        </div>
        <button type="button" className="export" onClick={add}>
          + Add {addText}
        </button>
      </div>

      {!items.length && <p className="notice">No entries yet. Add one to get started.</p>}

      <div className="content-list">
        {items.map((item, i) => (
          <details className="content-item" key={item.id}>
            <summary>
              <span className="entry-order">{String(i + 1).padStart(2, '0')}</span>
              <b>{item.name || item.role || item.topic || 'Untitled entry'}</b>
              <span className="badge">{item.published ? 'Published' : 'Draft'}</span>
            </summary>
            <div className="content-item-body">
              <div className="entry-actions">
                <button
                  type="button"
                  className="plainbutton"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  ↑ Move up
                </button>
                <button
                  type="button"
                  className="plainbutton"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓ Move down
                </button>
                <button
                  type="button"
                  className="plainbutton remove-entry"
                  onClick={() => {
                    if (confirm(`Remove this ${addText} from the website when you save?`)) {
                      onChange(items.filter((x) => x.id !== item.id));
                    }
                  }}
                >
                  Remove {addText}
                </button>
              </div>

              <label className="content-check">
                <input
                  type="checkbox"
                  checked={item.published !== false}
                  onChange={(e) => edit(item.id, 'published', e.target.checked)}
                />
                Publish on website
              </label>

              {members && (
                <label className="content-check">
                  <input
                    type="checkbox"
                    checked={item.placeholder || false}
                    onChange={(e) => edit(item.id, 'placeholder', e.target.checked)}
                  />
                  Placeholder profile — appointment not confirmed
                </label>
              )}

              <div className="settingsfields">
                {(members
                  ? [
                      ['name', 'Full name'],
                      ['role', 'Committee role'],
                      ['group', 'Committee group'],
                      ['affiliation', 'Institution / affiliation'],
                      ['country', 'Country'],
                      ['expertise', 'Areas of expertise']
                    ]
                  : isSpeakers
                  ? [
                      ['name', 'Full name and title'],
                      ['role', 'Speaker role / designation'],
                      ['organizationName', 'Organization / institution'],
                      ['topic', 'Keynote / presentation topic']
                    ]
                  : [
                      ['name', 'Track / session title'],
                      ['category', 'Research area / category']
                    ]
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      required={
                        key === 'role' ||
                        (!members && key === 'name') ||
                        (members && key === 'name' && !item.placeholder)
                      }
                      maxLength={2000}
                      value={item[key] || ''}
                      onChange={(e) => edit(item.id, key, e.target.value)}
                    />
                  </label>
                ))}

                <label>
                  {members ? 'Biography' : isSpeakers ? 'Speaker biography' : 'Track description'}
                  <textarea
                    rows={members || isSpeakers ? 6 : 3}
                    maxLength={10000}
                    value={members || isSpeakers ? item.bio || '' : item.summary || ''}
                    onChange={(e) =>
                      edit(item.id, members || isSpeakers ? 'bio' : 'summary', e.target.value)
                    }
                  />
                </label>

                {!members && !isSpeakers && (
                  <label>
                    Session topics (one per line)
                    <textarea
                      rows={6}
                      value={(item.topics || []).join('\n')}
                      onChange={(e) => edit(item.id, 'topics', e.target.value.split('\n'))}
                    />
                  </label>
                )}
              </div>

              {(members || isSpeakers) && (
                <div className="member-photo-editor">
                  <h3>{isSpeakers ? 'Speaker photograph' : 'Profile photograph'}</h3>
                  {item.photo?.url ? (
                    <>
                      <img
                        src={item.photo.url}
                        alt={item.name || (isSpeakers ? 'Speaker' : 'Committee member')}
                        style={{ width: 100, height: 115, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <p>{item.photo.fileName}</p>
                    </>
                  ) : (
                    <p>No photograph uploaded. Role initials / icon will be shown.</p>
                  )}
                  <p className="footnote">
                    Save your changes first, then choose and upload an approved PNG, JPEG or WebP photo (maximum 5 MB).
                  </p>
                  <label>
                    Choose photograph
                    <input
                      type="file"
                      name={'photo-' + item.id}
                      accept=".png,.jpg,.jpeg,.webp"
                      disabled={dirty || busy}
                    />
                  </label>
                  <button
                    type="button"
                    className="plainbutton"
                    disabled={dirty || busy}
                    onClick={async (e) => {
                      const container = e.currentTarget.closest('.member-photo-editor');
                      const input = container.querySelector('input[type=file]');
                      if (!input.files?.length) {
                        alert('Choose a photograph first.');
                        return;
                      }
                      const synthetic = {
                        preventDefault() {},
                        currentTarget: { photoFile: input.files[0] }
                      };
                      await onPhoto(synthetic, item.id, isSpeakers ? 'speakerPhoto' : 'committeePhoto');
                      input.value = '';
                    }}
                  >
                    Upload photograph
                  </button>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      <p>
        <a href={previewHref} target="_blank" rel="noopener noreferrer">
          Preview website page ↗
        </a>
      </p>
      <p className="footnote">
        Changes are applied only when you select Save & publish settings. Unpublishing hides an entry while keeping it available for later edits.
      </p>
    </>
  );
}
