import { useState, useMemo, useRef } from 'react';
import {
  BookOpenIcon,
  SearchIcon,
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  EditIcon,
  ClockIcon,
  MapPinIcon,
  LeafIcon,
  SparklesIcon,
  CloseIcon,
  CheckIcon,
  CompassIcon,
} from './Icons.jsx';
import {
  exportEntryAsMarkdown,
  exportAllAsJson,
  importEntriesFromJson,
} from '../lib/storage.js';

export function FieldLibrary({
  entries = [],
  onDeleteEntry,
  onUpdateEntry,
  onStartNewMission,
  onEntriesImported,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [activeEntryModal, setActiveEntryModal] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', readableNotes: '', tags: '' });
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    entries.forEach((e) => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // Filter and sort entries (newest first)
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        const matchesQuery =
          !searchQuery ||
          entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.readableNotes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.originalSummary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.location?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTag =
          !selectedTag || (Array.isArray(entry.tags) && entry.tags.includes(selectedTag));

        return matchesQuery && matchesTag;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [entries, searchQuery, selectedTag]);

  // Handle Edit
  const startEdit = (entry) => {
    setEditingEntryId(entry.id);
    setEditForm({
      title: entry.title || '',
      readableNotes: entry.readableNotes || '',
      tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : '',
    });
  };

  const cancelEdit = () => {
    setEditingEntryId(null);
  };

  const saveEdit = (id) => {
    const parsedTags = editForm.tags
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter((t) => t.length > 0);

    onUpdateEntry(id, {
      title: editForm.title.trim() || 'Field Observation',
      readableNotes: editForm.readableNotes.trim(),
      tags: parsedTags,
    });

    if (activeEntryModal && activeEntryModal.id === id) {
      setActiveEntryModal((prev) => ({
        ...prev,
        title: editForm.title.trim(),
        readableNotes: editForm.readableNotes.trim(),
        tags: parsedTags,
      }));
    }

    setEditingEntryId(null);
  };

  // Handle file import
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const result = importEntriesFromJson(content);
        if (result.ok) {
          setImportStatus(`Successfully restored ${result.addedCount} new field notes!`);
          if (onEntriesImported) onEntriesImported(result.entries);
        } else {
          setImportStatus(`Import failed: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="field-library-view">
      <div className="view-header">
        <span className="view-badge">
          <BookOpenIcon size={16} /> Field Journal Archives
        </span>
        <div className="library-header-row">
          <div>
            <h2 className="view-title">My FieldNotes</h2>
            <p className="view-subtitle">
              Your personal record of outdoor attention, preserved 100% locally on this machine.
            </p>
          </div>
          <div className="library-top-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportAllAsJson}
              title="Download full JSON backup of all journal entries"
            >
              <DownloadIcon size={15} /> Export All (JSON)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fileInputRef.current?.click()}
              title="Restore entries from a backup JSON file"
            >
              <UploadIcon size={15} /> Import Backup
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {importStatus && (
        <div className="import-status-banner">
          <span>{importStatus}</span>
          <button className="icon-btn-sm" onClick={() => setImportStatus(null)}>
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="library-controls-bar">
        <div className="search-input-box">
          <SearchIcon size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search notes, sightings, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="tag-filter-scroll">
            <button
              className={`tag-filter-chip ${selectedTag === '' ? 'tag-filter-active' : ''}`}
              onClick={() => setSelectedTag('')}
            >
              All Tags ({entries.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tag-filter-chip ${selectedTag === tag ? 'tag-filter-active' : ''}`}
                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List or Empty State */}
      {filteredEntries.length === 0 ? (
        <div className="library-empty-state">
          <LeafIcon size={44} className="empty-leaf-icon" />
          <h3>
            {entries.length === 0
              ? 'Your Field Journal is Empty'
              : 'No Observations Matched Your Search'}
          </h3>
          <p>
            {entries.length === 0
              ? 'Take your first step outside. Generate a personalized 5–20 minute mission and record what you discover.'
              : 'Try clearing your search query or tag filter to view all recorded field notes.'}
          </p>
          {entries.length === 0 ? (
            <button className="btn btn-primary btn-lg" onClick={onStartNewMission}>
              <CompassIcon size={18} />
              Start Your First Mission
            </button>
          ) : (
            <button
              className="btn btn-outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="entries-grid">
          {filteredEntries.map((entry) => {
            const isEditing = editingEntryId === entry.id;
            const dateStr = entry.createdAt
              ? new Date(entry.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent';

            return (
              <article key={entry.id} className="entry-card">
                {isEditing ? (
                  <div className="entry-inline-edit">
                    <input
                      type="text"
                      className="text-input"
                      value={editForm.title}
                      onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Title"
                    />
                    <textarea
                      rows={5}
                      className="text-area"
                      value={editForm.readableNotes}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, readableNotes: e.target.value }))
                      }
                      placeholder="Observation notes"
                    />
                    <input
                      type="text"
                      className="text-input"
                      value={editForm.tags}
                      onChange={(e) => setEditForm((p) => ({ ...p, tags: e.target.value }))}
                      placeholder="Tags (comma-separated)"
                    />
                    <div className="edit-actions-row">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => saveEdit(entry.id)}
                      >
                        <CheckIcon size={14} /> Save Changes
                      </button>
                      <button className="btn btn-sm btn-outline" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="entry-top-meta">
                      <span className="entry-date">{dateStr}</span>
                      <div className="entry-pills">
                        <span className="entry-pill">
                          <ClockIcon size={12} /> {entry.duration || 10}m
                        </span>
                        {entry.location && (
                          <span className="entry-pill">
                            <MapPinIcon size={12} /> {entry.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3
                      className="entry-title"
                      onClick={() => setActiveEntryModal(entry)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setActiveEntryModal(entry)}
                    >
                      {entry.title}
                    </h3>

                    <p className="entry-excerpt">
                      {entry.readableNotes?.substring(0, 160) || entry.originalSummary || ''}...
                    </p>

                    {/* Tag list */}
                    {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                      <div className="entry-tags">
                        {entry.tags.map((t) => (
                          <span
                            key={t}
                            className="tag-badge"
                            onClick={() => setSelectedTag(t)}
                            role="button"
                            tabIndex={0}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom action controls */}
                    <div className="entry-footer-actions">
                      <button
                        className="icon-action-btn"
                        onClick={() => setActiveEntryModal(entry)}
                        title="View full note details"
                      >
                        <BookOpenIcon size={15} /> View
                      </button>
                      <button
                        className="icon-action-btn"
                        onClick={() => exportEntryAsMarkdown(entry)}
                        title="Export note as Markdown (.md)"
                      >
                        <DownloadIcon size={15} /> Export MD
                      </button>
                      <button
                        className="icon-action-btn"
                        onClick={() => startEdit(entry)}
                        title="Edit entry"
                      >
                        <EditIcon size={15} /> Edit
                      </button>
                      <button
                        className="icon-action-btn delete-btn"
                        onClick={() => {
                          if (window.confirm(`Delete field note "${entry.title}"?`)) {
                            onDeleteEntry(entry.id);
                          }
                        }}
                        title="Delete entry"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Entry Details Modal */}
      {activeEntryModal && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveEntryModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card modal-entry-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="entry-modal-date">
                  {new Date(activeEntryModal.createdAt).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <h3 className="modal-title">{activeEntryModal.title}</h3>
                <div className="entry-pills mt-2">
                  <span className="entry-pill">
                    <ClockIcon size={13} /> {activeEntryModal.duration || 10} minutes
                  </span>
                  <span className="entry-pill">{activeEntryModal.environment || 'Outdoors'}</span>
                  {activeEntryModal.location && (
                    <span className="entry-pill">
                      <MapPinIcon size={13} /> {activeEntryModal.location}
                    </span>
                  )}
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => setActiveEntryModal(null)}
                aria-label="Close"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="modal-body entry-modal-body">
              {/* Polished notes */}
              <div className="detail-section">
                <h4 className="detail-sec-title">Field Reflection</h4>
                <div className="detail-text-body">
                  {activeEntryModal.readableNotes?.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  )) || <p>{activeEntryModal.readableNotes}</p>}
                </div>
              </div>

              {/* Raw notes */}
              {(activeEntryModal.rawInput?.notes || activeEntryModal.originalSummary) && (
                <div className="detail-section raw-box">
                  <h4 className="detail-sec-title">Authentic Notes Recorded at Time of Return</h4>
                  <p className="raw-quote">
                    “{activeEntryModal.rawInput?.notes || activeEntryModal.originalSummary}”
                  </p>
                  {activeEntryModal.rawInput?.surprises && (
                    <p className="raw-sub">
                      <strong>Surprises:</strong> {activeEntryModal.rawInput.surprises}
                    </p>
                  )}
                  {activeEntryModal.rawInput?.sensoryDetails && (
                    <p className="raw-sub">
                      <strong>Sensory Details:</strong> {activeEntryModal.rawInput.sensoryDetails}
                    </p>
                  )}
                </div>
              )}

              {/* Reflection prompt */}
              {activeEntryModal.reflectionPrompt && (
                <div className="detail-section reflection-box">
                  <SparklesIcon size={16} />
                  <div>
                    <strong>Observation Cue for Next Time:</strong>
                    <p>{activeEntryModal.reflectionPrompt}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {Array.isArray(activeEntryModal.tags) && activeEntryModal.tags.length > 0 && (
                <div className="entry-modal-tags">
                  {activeEntryModal.tags.map((t) => (
                    <span key={t} className="tag-badge">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => exportEntryAsMarkdown(activeEntryModal)}
              >
                <DownloadIcon size={16} /> Export as Markdown (.md)
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setActiveEntryModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
