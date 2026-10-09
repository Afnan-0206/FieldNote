import { useState, useEffect, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  RotateCcwIcon,
  CheckIcon,
  LeafIcon,
  ArrowLeftIcon,
  EyeIcon,
} from './Icons.jsx';
import { playGentleChime } from '../lib/audio.js';

export function PocketMode({
  mission,
  onFinishObservation,
  onExitPocketMode,
}) {
  const initialSeconds = (mission?.duration || 10) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState({});
  const intervalRef = useRef(null);

  // Timer countdown effect with proper cleanup
  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsActive(false);
            setIsFinished(true);
            playGentleChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, secondsRemaining]);

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsFinished(false);
    setSecondsRemaining(initialSeconds);
  };

  const addOneMinute = () => {
    setSecondsRemaining((prev) => prev + 60);
    if (isFinished) {
      setIsFinished(false);
      setIsActive(true);
    }
  };

  const toggleStep = (idx) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const elapsedSeconds = initialSeconds - secondsRemaining;
  const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  return (
    <div className={`pocket-mode-screen ${isFinished ? 'timer-completed-state' : ''}`}>
      {/* Top calm header */}
      <div className="pocket-header">
        <button
          type="button"
          className="pocket-back-btn"
          onClick={onExitPocketMode}
          aria-label="Exit pocket mode"
        >
          <ArrowLeftIcon size={18} />
          <span>Exit Pocket Mode</span>
        </button>
        <span className="pocket-badge">
          <LeafIcon size={14} /> Screen-Free Mode
        </span>
      </div>

      <div className="pocket-main-container">
        {/* Mission title and gentle invitation */}
        <div className="pocket-title-group">
          <h2 className="pocket-mission-title">{mission?.title || 'Outdoor Observation'}</h2>
          <p className="pocket-prompt-sub">
            {isFinished
              ? 'Observation time complete. Take a final breath and record what you noticed.'
              : 'Now put your phone away or slip it in your pocket. Look up, listen, and breathe.'}
          </p>
        </div>

        {/* Minimalist Countdown Timer */}
        <div className="pocket-timer-container">
          <div className={`pocket-timer-digits ${isFinished ? 'pulse-done' : ''}`} aria-live="polite">
            {formattedTime}
          </div>

          <div className="pocket-timer-controls">
            <button
              type="button"
              className={`pocket-btn-circle ${isActive ? 'btn-active' : ''}`}
              onClick={toggleTimer}
              aria-label={isActive ? 'Pause timer' : 'Resume timer'}
            >
              {isActive ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            </button>

            <button
              type="button"
              className="pocket-btn-pill"
              onClick={addOneMinute}
              title="Add 1 minute"
            >
              +1m
            </button>

            <button
              type="button"
              className="pocket-btn-pill"
              onClick={resetTimer}
              title="Reset timer"
            >
              <RotateCcwIcon size={16} />
            </button>
          </div>
        </div>

        {/* Essential Instructions Card */}
        {Array.isArray(mission?.steps) && mission.steps.length > 0 && (
          <div className="pocket-steps-card">
            <div className="pocket-steps-header">
              <EyeIcon size={16} />
              <span>Observation Cues</span>
            </div>
            <ul className="pocket-steps-checklist">
              {mission.steps.map((step, idx) => {
                const isChecked = Boolean(checkedSteps[idx]);
                return (
                  <li
                    key={idx}
                    className={`pocket-step-item ${isChecked ? 'is-done' : ''}`}
                    onClick={() => toggleStep(idx)}
                  >
                    <span className="pocket-check-box">
                      {isChecked && <CheckIcon size={14} />}
                    </span>
                    <span className="pocket-step-text">{step}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Bottom prominent action */}
        <div className="pocket-completion-action">
          <button
            type="button"
            className="btn btn-primary btn-lg pocket-finish-btn"
            onClick={() => onFinishObservation({ ...mission, actualMinutes: elapsedMinutes })}
          >
            <CheckIcon size={20} />
            {isFinished
              ? 'Complete Mission & Write Notes'
              : 'I Have Finished Observing — Open Journal'}
          </button>
        </div>
      </div>
    </div>
  );
}
