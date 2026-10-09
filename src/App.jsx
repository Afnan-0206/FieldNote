import { useState, useEffect } from 'react';
import './App.css';
import { Header } from './components/Header.jsx';
import { HomeDashboard } from './components/HomeDashboard.jsx';
import { MissionGenerator } from './components/MissionGenerator.jsx';
import { PocketMode } from './components/PocketMode.jsx';
import { NatureJournal } from './components/NatureJournal.jsx';
import { FieldLibrary } from './components/FieldLibrary.jsx';
import { WhyLocalAi } from './components/WhyLocalAi.jsx';
import { AiStatusModal } from './components/AiStatusModal.jsx';
import {
  getEntries,
  saveEntry,
  deleteEntry,
  getStats,
  recordMissionCompleted,
  getActiveMission,
  setActiveMission,
} from './lib/storage.js';
import { fetchAiHealth, generateMission, organizeNotes } from './lib/api.js';

export function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [health, setHealth] = useState(null);
  const [isHealthRefreshing, setIsHealthRefreshing] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Journal entries & stats
  const [entries, setEntries] = useState(() => getEntries());
  const [stats, setStats] = useState(() => getStats());

  // Mission workflow state
  const [mission, setMission] = useState(() => getActiveMission());
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [missionError, setMissionError] = useState(null);

  // Reflection workflow state
  const [isOrganizingNotes, setIsOrganizingNotes] = useState(false);
  const [organizeError, setOrganizeError] = useState(null);

  const refreshHealth = async () => {
    setIsHealthRefreshing(true);
    try {
      const data = await fetchAiHealth();
      setHealth(data);
    } finally {
      setIsHealthRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    let ignore = false;
    fetchAiHealth().then((data) => {
      if (!ignore) {
        setHealth(data);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Workflow Handlers
  const handleGenerateMission = async (params) => {
    setIsGeneratingMission(true);
    setMissionError(null);
    try {
      const res = await generateMission(params);
      if (res.ok && res.mission) {
        setMission(res.mission);
        setActiveMission(res.mission);
      } else {
        setMissionError(res.error || 'Failed to generate mission.');
      }
    } catch (err) {
      setMissionError(err.message);
    } finally {
      setIsGeneratingMission(false);
    }
  };

  const handleEnterPocketMode = (selectedMission) => {
    setMission(selectedMission);
    setActiveMission(selectedMission);
    setActiveTab('pocket');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishObservation = (missionWithActualTime) => {
    // Record statistics
    const recordedMinutes = missionWithActualTime?.actualMinutes || missionWithActualTime?.duration || 10;
    const updatedStats = recordMissionCompleted(recordedMinutes);
    if (updatedStats) {
      setStats((prev) => ({
        ...prev,
        missionsCompleted: updatedStats.missionsCompleted,
        totalMinutes: updatedStats.totalMinutes,
      }));
    }

    setMission(missionWithActualTime);
    setActiveMission(missionWithActualTime);
    setActiveTab('journal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrganizeNotesWithAi = async (params) => {
    setIsOrganizingNotes(true);
    setOrganizeError(null);
    try {
      const result = await organizeNotes(params);
      if (!result.ok) {
        setOrganizeError(result.error);
      }
      return result;
    } catch (err) {
      setOrganizeError(err.message);
      return { ok: false, error: err.message };
    } finally {
      setIsOrganizingNotes(false);
    }
  };

  const handleSaveEntry = (newEntry) => {
    const res = saveEntry(newEntry);
    if (res.ok) {
      setEntries(res.entries);
      setStats(getStats());
      setMission(null);
      setActiveMission(null);
      setActiveTab('library');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert(res.error || 'Failed to save entry.');
    }
  };

  const handleDeleteEntry = (id) => {
    const res = deleteEntry(id);
    if (res.ok) {
      setEntries(res.entries);
      setStats(getStats());
    }
  };

  const handleUpdateEntry = (id, patch) => {
    const existing = entries.find((e) => e.id === id);
    if (existing) {
      const updated = { ...existing, ...patch };
      const res = saveEntry(updated);
      if (res.ok) {
        setEntries(res.entries);
      }
    }
  };

  const handleResetMission = () => {
    setMission(null);
    setActiveMission(null);
    setMissionError(null);
  };

  const handleEntriesImported = (importedEntries) => {
    setEntries(importedEntries);
    setStats(getStats());
  };

  return (
    <div className="fieldnote-app">
      {/* Primary Navigation & Live AI Status */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        health={health}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        entryCount={entries.length}
      />

      <main className="main-content container">
        {/* Section A: Home / Today's FieldNote */}
        {activeTab === 'home' && (
          <HomeDashboard
            stats={stats}
            recentEntries={entries}
            health={health}
            onStartMission={() => setActiveTab('mission')}
            onViewLibrary={() => setActiveTab('library')}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onViewEntry={() => {
              setActiveTab('library');
            }}
          />
        )}

        {/* Section B: Mission Generator */}
        {activeTab === 'mission' && (
          <MissionGenerator
            onGenerateMission={handleGenerateMission}
            isGenerating={isGeneratingMission}
            mission={mission}
            onEnterPocketMode={handleEnterPocketMode}
            onStartReflection={() => setActiveTab('journal')}
            onResetMission={handleResetMission}
            pastEntries={entries}
            errorMessage={missionError}
            health={health}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}

        {/* Section C: Pocket Mode (Distraction-Free) */}
        {activeTab === 'pocket' && (
          <PocketMode
            mission={mission}
            onFinishObservation={handleFinishObservation}
            onExitPocketMode={() => setActiveTab('mission')}
          />
        )}

        {/* Section D: Nature Journal (Post-Mission Reflection) */}
        {activeTab === 'journal' && (
          <NatureJournal
            mission={mission}
            onSaveEntry={handleSaveEntry}
            onOrganizeNotesWithAi={handleOrganizeNotesWithAi}
            isOrganizing={isOrganizingNotes}
            organizeError={organizeError}
            health={health}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}

        {/* Section E: Field Library (Archives) */}
        {activeTab === 'library' && (
          <FieldLibrary
            entries={entries}
            onDeleteEntry={handleDeleteEntry}
            onUpdateEntry={handleUpdateEntry}
            onStartNewMission={() => {
              setMission(null);
              setActiveMission(null);
              setActiveTab('mission');
            }}
            onEntriesImported={handleEntriesImported}
          />
        )}

        {/* Section F: Open-Source AI Information */}
        {activeTab === 'why-ai' && (
          <WhyLocalAi
            health={health}
            onRefreshHealth={refreshHealth}
            isRefreshing={isHealthRefreshing}
          />
        )}
      </main>

      {/* Local AI Diagnostics Modal */}
      <AiStatusModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        health={health}
        onRefreshHealth={refreshHealth}
        isRefreshing={isHealthRefreshing}
      />
    </div>
  );
}

export default App;
