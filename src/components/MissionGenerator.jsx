import { useState } from 'react';
import {
  CompassIcon,
  ClockIcon,
  SparklesIcon,
  CheckIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  PlayIcon,
  EditIcon,
  ShieldIcon,
  LeafIcon,
} from './Icons.jsx';

const DURATION_OPTIONS = [
  { value: 5, label: '5 Minutes', subtitle: 'Quick screen break' },
  { value: 10, label: '10 Minutes', subtitle: 'Mindful loop' },
  { value: 20, label: '20 Minutes', subtitle: 'Deep immersive walk' },
];

const INTEREST_OPTIONS = [
  { id: 'plants', label: 'Plants & Flora' },
  { id: 'birds', label: 'Birds & Flight' },
  { id: 'insects', label: 'Insects & Creepers' },
  { id: 'trees', label: 'Trees & Bark' },
  { id: 'clouds', label: 'Clouds & Sky' },
  { id: 'sounds', label: 'Natural Sounds' },
  { id: 'textures', label: 'Textures & Ground' },
  { id: 'general', label: 'General Nature' },
];

const ENVIRONMENT_OPTIONS = [
  { id: 'park', label: 'Public Park / Green' },
  { id: 'garden', label: 'Garden / Yard' },
  { id: 'street', label: 'Neighborhood Street' },
  { id: 'balcony', label: 'Balcony / Porch' },
  { id: 'window', label: 'Window / Indoor Greenery' },
  { id: 'woodland', label: 'Woods / Trail' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'curious', label: 'Curious Observer' },
  { id: 'naturalist', label: 'Mindful Naturalist' },
];

export function MissionGenerator({
  onGenerateMission,
  isGenerating,
  mission,
  onEnterPocketMode,
  onStartReflection,
  onResetMission,
  pastEntries = [],
  errorMessage,
  health,
  onOpenAiModal,
}) {
  const [duration, setDuration] = useState(10);
  const [selectedInterests, setSelectedInterests] = useState(['plants', 'trees']);
  const [environment, setEnvironment] = useState('park');
  const [customEnv, setCustomEnv] = useState('');
  const [experience, setExperience] = useState('curious');
  const [includePastObservations, setIncludePastObservations] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState({});

  const toggleInterest = (id) => {
    setSelectedInterests((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleGenerateClick = () => {
    const activeEnvironment = customEnv.trim() || environment;
    const previousObservations = includePastObservations && pastEntries.length > 0
      ? pastEntries.slice(0, 4).map((e) => e.title || e.originalSummary || '')
      : [];

    setCheckedSteps({});
    onGenerateMission({
      duration,
      interests: selectedInterests,
      environment: activeEnvironment,
      experience,
      previousObservations,
    });
  };

  const toggleStep = (idx) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="mission-generator-view">
      <div className="view-header">
        <span className="view-badge">
          <CompassIcon size={16} /> Mission Generator
        </span>
        <h2 className="view-title">Step Away & Discover</h2>
        <p className="view-subtitle">
          Configure your outdoor moment. Our local AI model will design a tactile, screen-free mission tailored to your location.
        </p>
      </div>

      {/* AI offline alert if needed */}
      {!health?.ok && (
        <div className="ai-offline-warning">
          <AlertCircleIcon size={20} className="warning-icon" />
          <div className="warning-text">
            <strong>
              {health?.provider === 'cloudflare-workers-ai'
                ? 'Cloudflare Workers AI binding is not configured.'
                : 'Local AI is offline or model is not loaded.'}
            </strong>
            <span>
              {health?.error || (health?.provider === 'cloudflare-workers-ai'
                ? 'Add a Workers AI binding named "AI" in Cloudflare Pages Settings > Bindings.'
                : 'Make sure Ollama is running on http://127.0.0.1:11434 with model "qwen2.5:7b".')}
            </span>
          </div>
          <button className="btn btn-sm btn-outline" onClick={onOpenAiModal}>
            Troubleshoot
          </button>
        </div>
      )}

      {/* If an active mission is loaded, show the Mission Card */}
      {mission ? (
        <section className="mission-card-wrapper">
          <div className="mission-card">
            <div className="mission-header-bar">
              <span className="mission-tag">
                <LeafIcon size={14} /> Active Mission
              </span>
              <div className="mission-meta-pills">
                <span className="meta-pill">
                  <ClockIcon size={14} /> {mission.duration || duration} min
                </span>
                <span className="meta-pill">{mission.environment || environment}</span>
              </div>
            </div>

            <h3 className="mission-title">{mission.title}</h3>
            <p className="mission-description">{mission.description}</p>

            {/* Checklist of steps */}
            <div className="mission-steps-box">
              <h4 className="steps-heading">Concrete Observation Steps:</h4>
              <ul className="steps-list">
                {Array.isArray(mission.steps) &&
                  mission.steps.map((step, idx) => {
                    const isChecked = Boolean(checkedSteps[idx]);
                    return (
                      <li
                        key={idx}
                        className={`step-item ${isChecked ? 'step-checked' : ''}`}
                        onClick={() => toggleStep(idx)}
                      >
                        <button
                          type="button"
                          className={`step-checkbox ${isChecked ? 'checkbox-active' : ''}`}
                          aria-label={`Mark step ${idx + 1} as done`}
                        >
                          {isChecked && <CheckIcon size={14} />}
                        </button>
                        <span className="step-text">{step}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>

            {/* Reflection question */}
            {mission.reflectionQuestion && (
              <div className="reflection-question-card">
                <div className="reflection-q-header">
                  <SparklesIcon size={16} />
                  <span>Question to Ponder</span>
                </div>
                <p className="reflection-q-text">“{mission.reflectionQuestion}”</p>
              </div>
            )}

            {/* Safety & ethics reminder */}
            {mission.safetyReminder && (
              <div className="safety-reminder-strip">
                <ShieldIcon size={16} />
                <span>{mission.safetyReminder}</span>
              </div>
            )}

            {/* Pocket mode callout & actions */}
            <div className="mission-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onEnterPocketMode(mission)}>
                <PlayIcon size={18} />
                Enter Pocket Mode (Put Phone Away)
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => onStartReflection(mission)}>
                <EditIcon size={18} />
                Write Field Notes Directly
              </button>
              <button
                className="btn btn-ghost"
                onClick={onResetMission}
                title="Create a different mission"
              >
                <RefreshCwIcon size={16} />
                New Mission
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* Configuration Form */
        <div className="mission-form-card">
          {/* Duration selection */}
          <div className="form-group">
            <label className="form-label">
              <ClockIcon size={16} /> How much time do you have?
            </label>
            <div className="duration-grid">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`duration-card ${duration === opt.value ? 'selected' : ''}`}
                  onClick={() => setDuration(opt.value)}
                >
                  <span className="duration-title">{opt.label}</span>
                  <span className="duration-subtitle">{opt.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Environment selection */}
          <div className="form-group">
            <label className="form-label">Where are you stepping into?</label>
            <div className="pill-selector-grid">
              {ENVIRONMENT_OPTIONS.map((env) => (
                <button
                  key={env.id}
                  type="button"
                  className={`pill-btn ${environment === env.id && !customEnv ? 'pill-active' : ''}`}
                  onClick={() => {
                    setEnvironment(env.id);
                    setCustomEnv('');
                  }}
                >
                  {env.label}
                </button>
              ))}
            </div>
            <div className="custom-input-wrapper">
              <input
                type="text"
                placeholder="Or specify another location (e.g. riverside path, rooftop, backyard tree)..."
                value={customEnv}
                onChange={(e) => setCustomEnv(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          {/* Interests selection */}
          <div className="form-group">
            <label className="form-label">What catches your curiosity today?</label>
            <div className="interests-grid">
              {INTEREST_OPTIONS.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`interest-chip ${isSelected ? 'chip-active' : ''}`}
                    onClick={() => toggleInterest(item.id)}
                  >
                    <span className="chip-indicator">{isSelected ? '✓' : '+'}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience level */}
          <div className="form-group">
            <label className="form-label">Observation Depth</label>
            <div className="experience-row">
              {EXPERIENCE_OPTIONS.map((exp) => (
                <label key={exp.id} className="radio-label">
                  <input
                    type="radio"
                    name="experience"
                    value={exp.id}
                    checked={experience === exp.id}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                  <span>{exp.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Past entries context toggle */}
          {pastEntries.length > 0 && (
            <div className="context-toggle-box">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includePastObservations}
                  onChange={(e) => setIncludePastObservations(e.target.checked)}
                />
                <span>
                  <strong>Connect with your past field notes</strong> ({pastEntries.length} recorded). The local model will build on your previous sightings.
                </span>
              </label>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="form-error-callout">
              <AlertCircleIcon size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action button */}
          <div className="form-submit-row">
            <button
              type="button"
              className="btn btn-primary btn-lg submit-mission-btn"
              onClick={handleGenerateClick}
              disabled={isGenerating || !health?.ok}
            >
              {isGenerating ? (
                <>
                  <RefreshCwIcon size={18} className="spin-icon" />
                  Generating Mission with {health?.provider === 'cloudflare-workers-ai' ? 'Workers AI' : 'Local AI'} ({health?.model || 'AI'})...
                </>
              ) : (
                <>
                  <CompassIcon size={18} />
                  Generate {duration}-Minute Outdoor Mission
                </>
              )}
            </button>
            <span className="privacy-micro-badge">
              <ShieldIcon size={14} />
              {health?.provider === 'cloudflare-workers-ai'
                ? 'Serverless edge inference • Notes saved in browser'
                : 'Model runs 100% locally on your PC'}
            </span>
          </div>

          {isGenerating && (
            <div className="generating-tip-box">
              <SparklesIcon size={18} className="text-forest" />
              <p>
                <em>Field Tip:</em> Take a slow breath. Your local AI is composing 3–5 tactile steps to help you observe light, texture, and living patterns without looking at a screen.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
