import { useState } from 'react';
import {
  SparklesIcon,
  CheckIcon,
  ShieldIcon,
  MapPinIcon,
  TagIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  BookOpenIcon,
  LeafIcon,
  ClockIcon,
} from './Icons.jsx';

export function NatureJournal({
  mission,
  onSaveEntry,
  onOrganizeNotesWithAi,
  isOrganizing,
  organizeError,
  health,
  onOpenAiModal,
}) {
  // Input fields
  const [missionTitle, setMissionTitle] = useState(mission?.title || 'Outdoor Observation');
  const [notes, setNotes] = useState('');
  const [surprises, setSurprises] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [sensoryDetails, setSensoryDetails] = useState('');
  const environment = mission?.environment || 'park';
  const duration = mission?.duration || 10;

  // Resulting organized entry state (null until user organizes or saves directly)
  const [organizedEntry, setOrganizedEntry] = useState(null);

  // Editable fields for the organized view
  const [editableTitle, setEditableTitle] = useState('');
  const [editableReadableNotes, setEditableReadableNotes] = useState('');
  const [editableTags, setEditableTags] = useState('');
  const [editableReflection, setEditableReflection] = useState('');

  // Handle organize with AI
  const handleOrganizeClick = async () => {
    if (!notes.trim() && !surprises.trim()) {
      alert('Please write at least one observation or surprising detail before organizing.');
      return;
    }

    const result = await onOrganizeNotesWithAi({
      missionTitle,
      notes,
      surprises,
      location: locationLabel,
      sensoryDetails,
      duration,
      environment,
    });

    if (result && result.ok && result.entry) {
      setOrganizedEntry(result.entry);
      setEditableTitle(result.entry.title || missionTitle);
      setEditableReadableNotes(result.entry.readableNotes || notes);
      setEditableTags(Array.isArray(result.entry.tags) ? result.entry.tags.join(', ') : 'nature');
      setEditableReflection(result.entry.reflectionPrompt || '');
    }
  };

  // Handle final save
  const handleSaveClick = () => {
    const rawInput = {
      notes: notes.trim(),
      surprises: surprises.trim(),
      location: locationLabel.trim(),
      sensoryDetails: sensoryDetails.trim(),
    };

    let finalEntry;
    if (organizedEntry) {
      const parsedTags = editableTags
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
        .filter((t) => t.length > 0);

      finalEntry = {
        title: editableTitle.trim() || missionTitle,
        readableNotes: editableReadableNotes.trim() || notes,
        originalSummary: organizedEntry.originalSummary || notes,
        tags: parsedTags.length > 0 ? parsedTags : ['nature'],
        reflectionPrompt: editableReflection.trim(),
        rawInput,
        duration: Number(duration) || 10,
        environment,
        location: locationLabel.trim(),
        missionTitle,
      };
    } else {
      // Direct save without AI
      if (!notes.trim() && !surprises.trim()) {
        alert('Please write down your observations before saving.');
        return;
      }

      finalEntry = {
        title: missionTitle || 'Field Observation',
        readableNotes: notes.trim() || surprises.trim(),
        originalSummary: notes.trim(),
        tags: ['fieldnote', environment.toLowerCase().replace(/[^a-z0-9]/g, '')],
        reflectionPrompt: 'What caught your eye the most today?',
        rawInput,
        duration: Number(duration) || 10,
        environment,
        location: locationLabel.trim(),
        missionTitle,
      };
    }

    onSaveEntry(finalEntry);
  };

  return (
    <div className="nature-journal-view">
      <div className="view-header">
        <span className="view-badge">
          <BookOpenIcon size={16} /> Field Journal Reflection
        </span>
        <h2 className="view-title">Record Your Authentic Observations</h2>
        <p className="view-subtitle">
          Capture what you actually witnessed outside. Local AI will assist in formatting, without inventing facts or species.
        </p>
      </div>

      <div className="journal-layout-grid">
        {/* Left Column: Reflection Form */}
        <div className="reflection-form-card">
          <div className="form-card-header">
            <h3>Observation Notes</h3>
            <span className="header-meta-pill">
              <ClockIcon size={13} /> {duration} min in {environment}
            </span>
          </div>

          <div className="journal-form-group">
            <label className="journal-label" htmlFor="mission-title-input">
              Mission / Subject Title
            </label>
            <input
              id="mission-title-input"
              type="text"
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              className="text-input"
              placeholder="e.g. Morning Birch Bark Study"
            />
          </div>

          <div className="journal-form-group">
            <label className="journal-label" htmlFor="noticed-input">
              What did you notice? <span className="req-star">*</span>
            </label>
            <textarea
              id="noticed-input"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-area"
              placeholder="Describe the textures, creatures, leaf veins, or stillness you encountered while your phone was away..."
            />
          </div>

          <div className="journal-form-group">
            <label className="journal-label" htmlFor="surprises-input">
              What surprised you?
            </label>
            <textarea
              id="surprises-input"
              rows={2}
              value={surprises}
              onChange={(e) => setSurprises(e.target.value)}
              className="text-area"
              placeholder="A sudden bird call, an insect hiding in moss, the chill of a shadow..."
            />
          </div>

          <div className="journal-form-group">
            <label className="journal-label" htmlFor="location-input">
              <MapPinIcon size={15} /> Location Label (Optional, Manual)
            </label>
            <input
              id="location-input"
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              className="text-input"
              placeholder="e.g. North Ridge Bench, Garden Edge (Never automatic GPS)"
            />
            <span className="field-hint">Your location is entered manually and stored only in this browser.</span>
          </div>

          <div className="journal-form-group">
            <label className="journal-label" htmlFor="sensory-input">
              Sensory Details (Sounds, Colours, Shapes, Weather)
            </label>
            <input
              id="sensory-input"
              type="text"
              value={sensoryDetails}
              onChange={(e) => setSensoryDetails(e.target.value)}
              className="text-input"
              placeholder="e.g. damp wind, ochre lichen, rustling oak canopy..."
            />
          </div>

          {/* AI organize trigger */}
          <div className="organize-action-strip">
            <button
              type="button"
              className="btn btn-primary btn-lg organize-btn"
              onClick={handleOrganizeClick}
              disabled={isOrganizing || (!notes.trim() && !surprises.trim())}
            >
              {isOrganizing ? (
                <>
                  <RefreshCwIcon size={18} className="spin-icon" />
                  Organizing with Local AI ({health?.model || 'qwen2.5:7b'})...
                </>
              ) : (
                <>
                  <SparklesIcon size={18} />
                  Organize My Notes with Local AI
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline direct-save-btn"
              onClick={handleSaveClick}
              disabled={isOrganizing || (!notes.trim() && !surprises.trim())}
              title="Save without AI restructuring"
            >
              <CheckIcon size={16} />
              Save As-Is
            </button>
          </div>

          {organizeError && (
            <div className="form-error-callout">
              <AlertCircleIcon size={18} />
              <div className="error-body">
                <strong>Local AI request could not be completed:</strong>
                <span>{organizeError}</span>
                <button type="button" className="inline-link" onClick={onOpenAiModal}>
                  View Ollama connection status
                </button>
              </div>
            </div>
          )}

          <div className="botanical-ethics-note">
            <ShieldIcon size={15} />
            <span>
              <strong>Naturalist Ethics:</strong> FieldNote preserves your authentic observations. Species names are suggestions and never definitive. Never touch or consume wild plants or fungi.
            </span>
          </div>
        </div>

        {/* Right Column: AI Organized Journal Entry Preview & Editor */}
        <div className="preview-column">
          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-tag-badge">
                <LeafIcon size={14} />
                <span>Field Journal Output</span>
              </div>
              {organizedEntry && (
                <span className="organized-badge">
                  <SparklesIcon size={13} /> Organized by {health?.model || 'Local AI'}
                </span>
              )}
            </div>

            {organizedEntry ? (
              <div className="organized-content-body">
                <div className="organized-group">
                  <label className="journal-label" htmlFor="organized-title">
                    Entry Title
                  </label>
                  <input
                    id="organized-title"
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="text-input font-serif-title"
                  />
                </div>

                {/* Original raw notes preserved callout */}
                <div className="raw-preserved-box">
                  <div className="raw-header">
                    <span className="raw-title">Authentic Observer's Notes (Preserved)</span>
                  </div>
                  <p className="raw-text">
                    {notes || surprises || 'No raw notes provided.'}
                  </p>
                </div>

                <div className="organized-group">
                  <label className="journal-label" htmlFor="organized-notes">
                    Polished Field Reflection (Editable)
                  </label>
                  <textarea
                    id="organized-notes"
                    rows={8}
                    value={editableReadableNotes}
                    onChange={(e) => setEditableReadableNotes(e.target.value)}
                    className="text-area readable-notes-area"
                  />
                </div>

                <div className="organized-group">
                  <label className="journal-label" htmlFor="organized-tags">
                    <TagIcon size={14} /> Observation Tags (comma-separated)
                  </label>
                  <input
                    id="organized-tags"
                    type="text"
                    value={editableTags}
                    onChange={(e) => setEditableTags(e.target.value)}
                    className="text-input"
                  />
                </div>

                <div className="organized-group">
                  <label className="journal-label" htmlFor="organized-reflection">
                    Prompt / Suggestion for Next Time
                  </label>
                  <input
                    id="organized-reflection"
                    type="text"
                    value={editableReflection}
                    onChange={(e) => setEditableReflection(e.target.value)}
                    className="text-input"
                  />
                </div>

                <div className="preview-save-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg save-full-btn"
                    onClick={handleSaveClick}
                  >
                    <CheckIcon size={18} />
                    Save to My FieldNotes
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-preview-state">
                <BookOpenIcon size={36} className="empty-book-icon" />
                <h4>Awaiting Your Field Notes</h4>
                <p>
                  Write your impressions on the left and click <strong>“Organize My Notes with Local AI”</strong> to see them transformed into an elegant, structured nature journal entry.
                </p>
                <div className="preview-tip-pill">
                  <SparklesIcon size={14} />
                  <span>Nothing is sent to third-party clouds or APIs</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
