import { CompassIcon, BookOpenIcon, ShieldIcon, SparklesIcon, ClockIcon, EyeIcon } from './Icons.jsx';
import { calculateBadges } from '../lib/storage.js';

export function HomeDashboard({
  stats,
  recentEntries = [],
  health,
  onStartMission,
  onViewLibrary,
  onOpenAiModal,
  onViewEntry,
}) {
  const badges = calculateBadges(stats, recentEntries);

  return (
    <div className="home-dashboard">
      {/* Hero invitation banner */}
      <section className="hero-card">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-leaf-dot" />
            Hacktoberfest 2026 • “Touch Grass” Challenge
          </div>
          <h2 className="hero-heading">Put the screen away. Step outside.</h2>
          <p className="hero-description">
            FieldNote pairs genuine, on-device open-weight AI with mindful observation. Receive a focused outdoor mission, place your phone in your pocket, and record authentic field notes when you return.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={onStartMission}>
              <CompassIcon size={20} />
              Generate My Mission
            </button>
            <button className="btn btn-outline btn-lg" onClick={onViewLibrary}>
              <BookOpenIcon size={20} />
              Browse Field Journal ({stats.totalObservations})
            </button>
          </div>
        </div>

        {/* Stats card */}
        <div className="stats-panel">
          <div className="stats-card-header">
            <h3>Observation Ledger</h3>
            <span className="stats-local-tag">Local Only</span>
          </div>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-number">{stats.missionsCompleted}</span>
              <span className="stat-label">Missions Completed</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats.totalMinutes}</span>
              <span className="stat-label">Minutes Outdoors</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats.totalObservations}</span>
              <span className="stat-label">Saved FieldNotes</span>
            </div>
          </div>
          <div className="stats-privacy-note">
            <ShieldIcon size={14} />
            <span>Zero telemetry. All notes stored on your device in browser storage.</span>
          </div>
        </div>
      </section>

      {/* AI status banner */}
      <section className="dashboard-status-strip">
        <div className="strip-left">
          <div className={`status-dot ${health?.ok ? 'status-dot-active' : 'status-dot-offline'}`} />
          <div className="strip-text">
            <strong>
              {health?.provider === 'cloudflare-workers-ai' ? 'Workers AI Engine: ' : 'Local AI Engine: '}
              {health?.model || (health?.provider === 'cloudflare-workers-ai' ? '@cf/meta/llama-3.2-3b-instruct' : 'qwen2.5:7b')}
            </strong>
            <span>
              {health?.ok
                ? (health?.provider === 'cloudflare-workers-ai'
                    ? 'Cloudflare Pages Functions + Workers AI edge inference ready.'
                    : 'Ollama instance running on localhost:11434. Private inference ready.')
                : (health?.provider === 'cloudflare-workers-ai'
                    ? 'Workers AI binding missing in project settings. Click for instructions.'
                    : 'Ollama is offline or model is missing. Click for instructions.')}
            </span>
          </div>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={onOpenAiModal}>
          <SparklesIcon size={14} />
          Inspect Status
        </button>
      </section>

      {/* Three-step ritual overview */}
      <section className="ritual-section">
        <div className="section-title-wrap">
          <h3 className="section-title">The Observation Ritual</h3>
          <p className="section-subtitle">How FieldNote helps you disconnect from digital noise</p>
        </div>

        <div className="ritual-grid">
          <div className="ritual-card">
            <div className="ritual-num">1</div>
            <h4>Personalized Mission</h4>
            <p>Select your setting and time (5–20 min). Local Qwen AI crafts concrete, non-intrusive observation prompts.</p>
          </div>
          <div className="ritual-card">
            <div className="ritual-num">2</div>
            <h4>Pocket Mode</h4>
            <p>Lock your screen, slip the phone into your pocket, and tune your senses to wind, bark, light, and sounds.</p>
          </div>
          <div className="ritual-card">
            <div className="ritual-num">3</div>
            <h4>Reflect & Preserve</h4>
            <p>Jot down your honest impressions. Local AI helps polish your notes while faithfully preserving every sighting.</p>
          </div>
        </div>
      </section>

      {/* Botanical Milestones & Habit Badges */}
      <section className="milestones-section">
        <div className="section-title-wrap">
          <h3 className="section-title">Botanical Milestones</h3>
          <p className="section-subtitle">Real-world outdoor attention badges unlocked on your device</p>
        </div>

        <div className="badges-grid">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`badge-card ${badge.unlocked ? 'badge-unlocked' : 'badge-locked'}`}
            >
              <div className="badge-icon-box">{badge.icon}</div>
              <div className="badge-info">
                <div className="badge-title-row">
                  <h4 className="badge-title">{badge.title}</h4>
                  <span className={`badge-status-pill ${badge.unlocked ? 'status-earned' : 'status-pending'}`}>
                    {badge.unlocked ? 'Unlocked' : badge.progress}
                  </span>
                </div>
                <p className="badge-desc">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent observations showcase */}
      {recentEntries.length > 0 && (
        <section className="recent-entries-section">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Recent Field Observations</h3>
              <p className="section-subtitle">Your latest moments of attention</p>
            </div>
            <button className="btn btn-sm btn-outline" onClick={onViewLibrary}>
              View All ({stats.totalObservations})
            </button>
          </div>

          <div className="recent-grid">
            {recentEntries.slice(0, 3).map((entry) => (
              <article
                key={entry.id}
                className="recent-card"
                onClick={() => onViewEntry(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onViewEntry(entry)}
              >
                <div className="recent-card-meta">
                  <span className="recent-date">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="recent-duration">
                    <ClockIcon size={13} />
                    {entry.duration || 10}m
                  </span>
                </div>
                <h4 className="recent-card-title">{entry.title}</h4>
                <p className="recent-card-snippet">
                  {entry.readableNotes?.substring(0, 110) || entry.originalSummary || 'Nature observation.'}...
                </p>
                <div className="recent-card-tags">
                  {Array.isArray(entry.tags) &&
                    entry.tags.slice(0, 3).map((t) => (
                      <span key={t} className="mini-tag">
                        #{t}
                      </span>
                    ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Mindful reminder */}
      <footer className="nature-reminder-footer">
        <EyeIcon size={20} className="reminder-icon" />
        <p>
          “The world is full of magic things, patiently waiting for our senses to grow sharper.”
          <span className="quote-author"> — W.B. Yeats</span>
        </p>
      </footer>
    </div>
  );
}
