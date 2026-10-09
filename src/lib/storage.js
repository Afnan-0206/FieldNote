/**
 * Browser-local storage manager for FieldNote.
 * Handles journals, statistics, and user preferences with corruption recovery.
 */

const STORAGE_KEYS = {
  ENTRIES: 'fieldnote_entries_v1',
  STATS: 'fieldnote_stats_v1',
  PREFERENCES: 'fieldnote_preferences_v1',
  ACTIVE_MISSION: 'fieldnote_active_mission_v1',
};

export function getEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read journal entries from localStorage:', err);
    return [];
  }
}

export function saveEntry(entry) {
  try {
    const existing = getEntries();
    const newEntry = {
      id: entry.id || `fn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...entry,
    };

    const index = existing.findIndex((e) => e.id === newEntry.id);
    let updated;
    if (index >= 0) {
      updated = [...existing];
      updated[index] = newEntry;
    } else {
      updated = [newEntry, ...existing];
    }

    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updated));
    return { ok: true, entry: newEntry, entries: updated };
  } catch (err) {
    console.error('Failed to save journal entry to localStorage:', err);
    return { ok: false, error: 'Could not save entry. Your browser storage might be full.' };
  }
}

export function deleteEntry(id) {
  try {
    const existing = getEntries();
    const filtered = existing.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filtered));
    return { ok: true, entries: filtered };
  } catch (err) {
    console.error('Failed to delete entry:', err);
    return { ok: false, error: err.message };
  }
}

export function getStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) {
      return { missionsCompleted: 0, totalMinutes: 0, totalObservations: getEntries().length };
    }
    const parsed = JSON.parse(raw);
    return {
      missionsCompleted: Number(parsed.missionsCompleted) || 0,
      totalMinutes: Number(parsed.totalMinutes) || 0,
      totalObservations: getEntries().length,
    };
  } catch {
    return { missionsCompleted: 0, totalMinutes: 0, totalObservations: getEntries().length };
  }
}

export function recordMissionCompleted(minutes = 10) {
  try {
    const current = getStats();
    const updated = {
      missionsCompleted: current.missionsCompleted + 1,
      totalMinutes: current.totalMinutes + Number(minutes || 0),
    };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to update stats:', err);
    return null;
  }
}

export function getPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function savePreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences:', err);
  }
}

export function getActiveMission() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_MISSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveMission(mission) {
  try {
    if (!mission) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_MISSION, JSON.stringify(mission));
    }
  } catch (err) {
    console.error('Failed to set active mission:', err);
  }
}

/**
 * Downloads a single field note formatted as clean Markdown.
 */
export function exportEntryAsMarkdown(entry) {
  const dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Undated';
  const timeStr = entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const md = `# FieldNote: ${entry.title || 'Outdoor Observation'}
*Observed on ${dateStr} at ${timeStr}*
*Environment: ${entry.environment || 'Outdoors'} | Duration: ${entry.duration || 10} minutes*
${entry.location ? `*Location: ${entry.location}*\n` : ''}
---

## Polished Field Reflection
${entry.readableNotes || ''}

## Raw Authentic Observations
${entry.rawInput?.notes ? `> ${entry.rawInput.notes}` : (entry.originalSummary || '')}

${entry.rawInput?.surprises ? `### Surprises & Micro-Encounters\n> ${entry.rawInput.surprises}\n` : ''}
${entry.rawInput?.sensoryDetails ? `### Sensory Notes\n> ${entry.rawInput.sensoryDetails}\n` : ''}

## Reflection for Next Time
${entry.reflectionPrompt || ''}

---
*Tags: ${Array.isArray(entry.tags) ? entry.tags.map((t) => `#${t}`).join(' ') : ''}*
*Created with FieldNote — Local-AI Nature Journal ("Touch Grass")*
`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const filename = `FieldNote_${(entry.title || 'observation').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dateStr.replace(/[^a-z0-9]/g, '-')}.md`;
  triggerDownload(blob, filename);
}

/**
 * Exports all entries as structured JSON.
 */
export function exportAllAsJson() {
  const entries = getEntries();
  const stats = getStats();
  const payload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    stats,
    entries,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const filename = `FieldNote_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  triggerDownload(blob, filename);
}

/**
 * Exports all entries as CSV format for spreadsheet / citizen science analysis.
 */
export function exportAllAsCsv() {
  const entries = getEntries();
  const headers = [
    'ID',
    'Date',
    'Title',
    'Duration_Min',
    'Environment',
    'Location',
    'Tags',
    'Weather',
    'Season',
    'Reflection_Notes',
    'Raw_Notes',
    'Surprises',
  ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = entries.map((e) =>
    [
      escapeCell(e.id),
      escapeCell(e.createdAt ? new Date(e.createdAt).toISOString() : ''),
      escapeCell(e.title || ''),
      escapeCell(e.duration || 10),
      escapeCell(e.environment || ''),
      escapeCell(e.location || ''),
      escapeCell(Array.isArray(e.tags) ? e.tags.join('; ') : ''),
      escapeCell(e.weather || ''),
      escapeCell(e.season || ''),
      escapeCell(e.readableNotes || e.originalSummary || ''),
      escapeCell(e.rawInput?.notes || ''),
      escapeCell(e.rawInput?.surprises || ''),
    ].join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const filename = `FieldNote_Data_${new Date().toISOString().slice(0, 10)}.csv`;
  triggerDownload(blob, filename);
}


/**
 * Imports backup JSON and merges with existing entries.
 */
export function importEntriesFromJson(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    const newItems = Array.isArray(data) ? data : Array.isArray(data?.entries) ? data.entries : null;
    if (!newItems) {
      return { ok: false, error: 'Uploaded file does not contain a valid list of FieldNotes.' };
    }

    const current = getEntries();
    const idMap = new Map();
    // Prioritize existing entries, add new ones
    current.forEach((e) => idMap.set(e.id, e));
    let addedCount = 0;

    newItems.forEach((item) => {
      if (item && item.title) {
        const id = item.id || `fn_import_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        if (!idMap.has(id)) {
          idMap.set(id, { ...item, id });
          addedCount++;
        }
      }
    });

    const merged = Array.from(idMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(merged));
    return { ok: true, addedCount, entries: merged };
  } catch (err) {
    return { ok: false, error: `Import failed: ${err.message}` };
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Calculates unlocked badges and milestone progress based on observation history.
 */
export function calculateBadges(stats, entries = []) {
  const missions = Number(stats?.missionsCompleted) || 0;
  const minutes = Number(stats?.totalMinutes) || 0;
  const noteCount = entries.length;

  return [
    {
      id: 'first-sprout',
      title: 'First Sprout',
      icon: '🌱',
      description: 'Completed your very first outdoor observation mission.',
      unlocked: missions >= 1,
      progress: `${Math.min(missions, 1)}/1`,
    },
    {
      id: 'half-hour',
      title: '30 Mins Grounded',
      icon: '⏱️',
      description: 'Spent at least 30 minutes in nature with phone tucked away.',
      unlocked: minutes >= 30,
      progress: `${Math.min(minutes, 30)}/30 min`,
    },
    {
      id: 'canopy-seeker',
      title: 'Canopy Seeker',
      icon: '🌲',
      description: 'Recorded observations across 3 or more field sessions.',
      unlocked: noteCount >= 3,
      progress: `${Math.min(noteCount, 3)}/3`,
    },
    {
      id: 'century-naturalist',
      title: 'Century Naturalist',
      icon: '💯',
      description: 'Accumulated over 100 mindful minutes outdoors.',
      unlocked: minutes >= 100,
      progress: `${Math.min(minutes, 100)}/100 min`,
    },
    {
      id: 'grass-toucher',
      title: 'Dedicated Grass Toucher',
      icon: '🌾',
      description: 'Recorded 5 or more nature field notes in your local archive.',
      unlocked: noteCount >= 5,
      progress: `${Math.min(noteCount, 5)}/5`,
    },
    {
      id: 'master-naturalist',
      title: 'Master Naturalist',
      icon: '🦉',
      description: 'Recorded 10 or more detailed botanical observations.',
      unlocked: noteCount >= 10,
      progress: `${Math.min(noteCount, 10)}/10`,
    },
  ];
}

