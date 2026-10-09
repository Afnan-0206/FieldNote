import { useState } from 'react';
import { LeafIcon, CheckIcon, RotateCcwIcon } from './Icons.jsx';

const DEFAULT_CATEGORIES = [
  { id: 'birds', label: 'Birds', icon: '🐦' },
  { id: 'wildflowers', label: 'Wildflowers / Flora', icon: '🌸' },
  { id: 'trees', label: 'Trees & Foliage', icon: '🌲' },
  { id: 'moss', label: 'Moss & Lichen', icon: '🌿' },
  { id: 'fungi', label: 'Fungi & Mushrooms', icon: '🍄' },
  { id: 'insects', label: 'Insects & Pollinators', icon: '🐝' },
  { id: 'tracks', label: 'Tracks & Signs', icon: '🐾' },
  { id: 'water', label: 'Streams & Water', icon: '💧' },
];

export function SpeciesChecklist({ onApplyToNotes, initialCounts = {} }) {
  const [counts, setCounts] = useState(initialCounts);

  const increment = (id) => {
    setCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const decrement = (id) => {
    setCounts((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const resetAll = () => {
    setCounts({});
  };

  const totalSightings = Object.values(counts).reduce((sum, val) => sum + val, 0);

  const handleApply = () => {
    if (totalSightings === 0) return;
    const summaryItems = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => {
        const cat = DEFAULT_CATEGORIES.find((c) => c.id === id);
        return `${count} ${cat ? cat.label : id}`;
      });

    const summaryText = `Naturalist Sightings: ${summaryItems.join(', ')}.`;
    if (typeof onApplyToNotes === 'function') {
      onApplyToNotes(summaryText);
    }
  };

  return (
    <div className="species-checklist-card card-panel">
      <div className="species-checklist-header">
        <div className="species-header-left">
          <LeafIcon size={16} />
          <h4 className="species-title">Tactile Observation Counter</h4>
        </div>
        <div className="species-header-right">
          <span className="species-total-badge">{totalSightings} Sightings</span>
          {totalSightings > 0 && (
            <button
              type="button"
              className="species-reset-btn"
              onClick={resetAll}
              title="Reset all observation counts"
            >
              <RotateCcwIcon size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="species-grid">
        {DEFAULT_CATEGORIES.map((cat) => {
          const count = counts[cat.id] || 0;
          return (
            <div
              key={cat.id}
              className={`species-counter-item ${count > 0 ? 'item-active' : ''}`}
            >
              <span className="species-item-icon">{cat.icon}</span>
              <span className="species-item-name">{cat.label}</span>
              <div className="species-btn-group">
                {count > 0 && (
                  <button
                    type="button"
                    className="species-btn-step"
                    onClick={() => decrement(cat.id)}
                    aria-label={`Decrease ${cat.label}`}
                  >
                    -
                  </button>
                )}
                <span className="species-count-val">{count}</span>
                <button
                  type="button"
                  className="species-btn-step"
                  onClick={() => increment(cat.id)}
                  aria-label={`Increase ${cat.label}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalSightings > 0 && (
        <div className="species-apply-strip">
          <button
            type="button"
            className="btn btn-secondary btn-sm species-apply-btn"
            onClick={handleApply}
          >
            <CheckIcon size={14} /> Append Summary to Observation Notes
          </button>
        </div>
      )}
    </div>
  );
}
