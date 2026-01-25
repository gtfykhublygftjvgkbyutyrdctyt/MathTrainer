import React, { useState } from 'react';
import BurgerMenu from './Components/Burgermenu';
import MathTrainer from "./Components/Math";
import StatisticsModal from './Components/StatisticsModal';
import './App.css';

function App() {
  const [stats, setStats] = useState({
    totalProblems: 0,
    correctAnswers: 0,
    progressToNextLevel: 0,
    responseTimes: [],
    accuracyHistory: [],
  });
  const [maxLevelCorrectStreak, setMaxLevelCorrectStreak] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);

  return (
    <div className="app">
      <MathTrainer 
        stats={stats}
        setStats={setStats}
        maxLevelCorrectStreak={maxLevelCorrectStreak}
        setMaxLevelCorrectStreak={setMaxLevelCorrectStreak}
      />
      <BurgerMenu onShowStats={() => setShowStatsModal(true)} />
      
      {showStatsModal && (
        <StatisticsModal
          stats={stats}
          maxLevelCorrectStreak={maxLevelCorrectStreak}
          onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
}

export default App;
