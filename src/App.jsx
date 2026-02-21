import React, { useState, useEffect } from 'react';
import BurgerMenu from './Components/BurgerMenu';
import MathTrainer from "./Components/MathTrainer";
import StatisticsModal from './Components/StatisticsModal';
import SettingsModal from './Components/SettingsModal';
import './App.css';

const isLightColor = (hex) => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
};

const applyInterfaceColor = (color) => {
  document.documentElement.style.setProperty('--interface-color', color);
  const iconColor = isLightColor(color) ? '#333333' : '#ffffff';
  document.documentElement.style.setProperty('--interface-icon-color', iconColor);
};

function App() {
  const [stats, setStats] = useState({
    totalProblems: 0,
    correctAnswers: 0,
    progressToNextLevel: 0,
    responseTimes: [],
    accuracyHistory: [],
  });

  const [settings, setSettings] = useState({
    goal: 5,
    interfaceColor: '#348de6',
    operationsConfig: {
      basic: true,
      powers: false,
      log: false,
      sqrt: false,
      trig: { enabled: false, sin: false, cos: false, tan: false, cot: false }
    }
  });

  const [maxLevelCorrectStreak, setMaxLevelCorrectStreak] = useState(() => {
    const saved = localStorage.getItem('mathTrainerMaxStreak');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('mathTrainerHasVisited');

    if (!hasVisited) {
      setIsFirstVisit(true);
      setShowSettingsModal(true);
      localStorage.setItem('mathTrainerHasVisited', 'true');
    }
  }, []);

  useEffect(() => {
    const savedSettings = localStorage.getItem('mathTrainerSettings');
    if (savedSettings) {
      try {
        const loaded = JSON.parse(savedSettings);
        setSettings(loaded);

        if (loaded.interfaceColor) {
          applyInterfaceColor(loaded.interfaceColor);
        }
      } catch (e) {
        console.warn('Failed to load settings');
      }
    } else {
      applyInterfaceColor('#348de6');
    }
  }, []);

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);

    if (newSettings.interfaceColor) {
      applyInterfaceColor(newSettings.interfaceColor);
    }
  };

  useEffect(() => {
    localStorage.setItem('mathTrainerMaxStreak', maxLevelCorrectStreak.toString());
  }, [maxLevelCorrectStreak]);

  const openSettings = () => setShowSettingsModal(true);

  return (
    <div className="app">
      <MathTrainer
        stats={stats}
        setStats={setStats}
        maxLevelCorrectStreak={maxLevelCorrectStreak}
        setMaxLevelCorrectStreak={setMaxLevelCorrectStreak}
        settings={settings}
        onOpenSettings={openSettings}
        isFirstVisit={isFirstVisit}
      />
      <BurgerMenu
        onShowStats={() => setShowStatsModal(true)}
        onShowSettings={openSettings}
      />
      {showStatsModal && (
        <StatisticsModal
          stats={stats}
          maxLevelCorrectStreak={maxLevelCorrectStreak}
          onClose={() => setShowStatsModal(false)}
        />
      )}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default App;