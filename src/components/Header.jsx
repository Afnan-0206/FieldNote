import { LeafIcon, SparklesIcon, BookOpenIcon, CompassIcon, InfoIcon } from './Icons.jsx';

export function Header({
  activeTab,
  onSelectTab,
  health,
  onOpenAiModal,
  onOpenShortcuts,
  entryCount = 0,
}) {
  return (
    <header className="app-header">
      <div className="header-inner container">
        {/* Brand identity */}
        <div className="brand" onClick={() => onSelectTab('home')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelectTab('home')}>
          <div className="brand-logo" aria-hidden="true">
            <LeafIcon size={22} className="brand-icon" />
          </div>
          <div className="brand-text">
            <h1 className="brand-name">FieldNote</h1>
            <p className="brand-tagline">Less screen. More world.</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="header-nav" aria-label="Main navigation">
          <button
            className={`nav-btn ${activeTab === 'home' || activeTab === 'mission' || activeTab === 'pocket' || activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => onSelectTab('mission')}
          >
            <CompassIcon size={17} />
            <span>Today's Mission</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => onSelectTab('library')}
          >
            <BookOpenIcon size={17} />
            <span>Field Library</span>
            {entryCount > 0 && <span className="nav-badge">{entryCount}</span>}
          </button>

          <button
            className={`nav-btn ${activeTab === 'why-ai' ? 'active' : ''}`}
            onClick={() => onSelectTab('why-ai')}
          >
            <InfoIcon size={17} />
            <span>Why Local AI?</span>
          </button>
        </nav>

        {/* Local AI status badge and shortcuts */}
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn-sm"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
          >
            ⌨️
          </button>

          <button
            type="button"
            className={`ai-pill ${health?.ok ? 'ai-pill-active' : 'ai-pill-warning'}`}
            onClick={onOpenAiModal}
            title="Click for Local AI Diagnostics & Privacy Details"
            aria-label="Local AI Status"
          >
            <span className={`ai-pulse ${health?.ok ? 'pulse-green' : 'pulse-amber'}`} />
            <SparklesIcon size={14} />
            <span className="ai-pill-label">
              {health?.ok
                ? (health?.provider === 'cloudflare-workers-ai'
                    ? 'Workers AI (Cloud)'
                    : `${health?.model || 'qwen2.5:7b'} local`)
                : 'AI offline (check)'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
