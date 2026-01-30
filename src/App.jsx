import React, { useState, useEffect } from 'react';
import BurgerMenu from './Components/BurgerMenu';
import MathTrainer from "./Components/MathTrainer";
import StatisticsModal from './Components/StatisticsModal';
import SettingsModal from './Components/SettingsModal';
import './App.css';

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
    theme: 'light',
    operationsConfig: {
      basic: true,
      powers: false,
      log: false,
      sqrt: false,
      trig: { enabled: false, sin: false, cos: false, tan: false, cot: false }
    }
  });

  // Загружаем сохраненный рекорд или ставим 0
  const [maxLevelCorrectStreak, setMaxLevelCorrectStreak] = useState(() => {
    const saved = localStorage.getItem('mathTrainerMaxStreak');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('mathTrainerSettings');
    if (savedSettings) {
      try {
        const loaded = JSON.parse(savedSettings);
        setSettings(loaded);
        document.body.className = loaded.theme || 'light';
      } catch (e) {
        console.warn('Failed to load settings');
      }
    }
  }, []);

  // Sync theme
  useEffect(() => {
    document.body.className = settings.theme;
  }, [settings.theme]);

  // !!! НОВОЕ: Сохраняем рекорд при его изменении
  useEffect(() => {
    localStorage.setItem('mathTrainerMaxStreak', maxLevelCorrectStreak.toString());
  }, [maxLevelCorrectStreak]);

  return (
    <div className="app">
      <MathTrainer 
        stats={stats} 
        setStats={setStats} 
        maxLevelCorrectStreak={maxLevelCorrectStreak} 
        setMaxLevelCorrectStreak={setMaxLevelCorrectStreak} 
        settings={settings} 
      />
      <BurgerMenu
        onShowStats={() => setShowStatsModal(true)}
        onShowSettings={() => setShowSettingsModal(true)}
      />
      {showStatsModal && (
        <StatisticsModal
          stats={stats}
          maxLevelCorrectStreak={maxLevelCorrectStreak}
          onClose={() => setShowStatsModal(false)}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onSettingsChange={setSettings}
        />
      )}
    </div>
  );
}

export default App;