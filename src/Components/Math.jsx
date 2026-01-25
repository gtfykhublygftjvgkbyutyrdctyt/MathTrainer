import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MathTrainer.css';

const STORAGE_KEY = 'mathTrainerData';

const MathTrainer = ({ 
  stats, 
  setStats, 
  maxLevelCorrectStreak, 
  setMaxLevelCorrectStreak 
}) => {
  const [difficulty, setDifficulty] = useState(1);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [isStarted, setIsStarted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const maxDifficulty = 10;
  const goal = 5;
  const startTimeRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (inputRef.current && !isChecking && !isAnswered) {
      inputRef.current.focus();
    }
  }, [currentProblem, isChecking, isAnswered]);

  const saveToStorage = useCallback((statsData, diff, streak) => {
    try {
      const data = {
        stats: statsData,
        difficulty: diff,
        maxLevelCorrectStreak: streak,
        lastSaved: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Не удалось сохранить:', error);
    }
  }, []);

  const loadFromStorage = useCallback(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Date.now() - parsed.lastSaved < 30 * 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Не удалось загрузить:', error);
    }
    return null;
  }, []);

  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      setStats(savedData.stats);
      setDifficulty(savedData.difficulty);
      setMaxLevelCorrectStreak(savedData.maxLevelCorrectStreak || 0);
      setIsStarted(true);
    }
    setIsLoading(false);
  }, []); 
  useEffect(() => {
    if (isStarted && !currentProblem) {
      generateNewProblem();
    }
  }, [isStarted, difficulty]);

  const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getMinNumForLevel = (level) => {
    return Math.max(1, (level - 1) * 5 + 1);
  };

  const generateOperation = () => {
    if (difficulty <= 2) {
      return Math.random() > 0.5 ? '+' : '-';
    } else if (difficulty <= 4) {
      const rand = Math.random();
      if (rand < 0.4) return '+';
      if (rand < 0.8) return '-';
      return '*';
    } else {
      const rand = Math.random();
      if (rand < 0.3) return '+';
      if (rand < 0.55) return '-';
      if (rand < 0.8) return '*';
      return '/';
    }
  };

  const generateNumbers = (operation) => {
    const currentMinNum = getMinNumForLevel(difficulty);
    let maxNum1 = 15 + (difficulty - 1) * 8;
    let maxNum2 = 15 + (difficulty - 1) * 8;

    let num1, num2;
    let attempts = 0;
    const maxAttempts = 100;

    switch(operation) {
      case '+':
        if (difficulty <= 2) {
          num1 = getRandomInt(currentMinNum, maxNum1);
          num2 = getRandomInt(currentMinNum, maxNum2);
        } else {
          do {
            num1 = getRandomInt(currentMinNum, maxNum1);
            num2 = getRandomInt(currentMinNum, maxNum2);
            attempts++;
          } while ((num1 + num2) <= 5 && attempts < maxAttempts);
        }
        break;

      case '-':
        if (difficulty <= 2) {
          num2 = getRandomInt(currentMinNum, maxNum2);
          num1 = getRandomInt(num2 + 1, maxNum1);
        } else {
          do {
            num2 = getRandomInt(currentMinNum, maxNum2);
            num1 = getRandomInt(num2 + 1, maxNum1);
            attempts++;
          } while ((num1 - num2) <= 5 && attempts < maxAttempts);
        }
        break;

      case '*':
        if (difficulty <= 4) {
          num1 = getRandomInt(2, Math.min(6, maxNum1));
          num2 = getRandomInt(2, Math.min(6, maxNum2));
        } else if (difficulty <= 7) {
          num1 = getRandomInt(3, Math.min(10, maxNum1));
          num2 = getRandomInt(3, Math.min(10, maxNum2));
        } else {
          num1 = getRandomInt(4, Math.min(15, maxNum1));
          num2 = getRandomInt(4, Math.min(15, maxNum2));
        }
        break;

      case '/':
        if (difficulty <= 4) {
          num2 = getRandomInt(2, 4);
          num1 = num2 * getRandomInt(2, 8);
        } else if (difficulty <= 7) {
          num2 = getRandomInt(2, 8);
          num1 = num2 * getRandomInt(2, 12);
        } else {
          num2 = getRandomInt(3, 12);
          num1 = num2 * getRandomInt(2, Math.floor(maxNum1 / num2));
        }
        break;

      default:
        num1 = getRandomInt(currentMinNum, maxNum1);
        num2 = getRandomInt(currentMinNum, maxNum2);
    }

    return { num1, num2 };
  };

  const calculateAnswer = (num1, num2, operation) => {
    switch(operation) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '*': return num1 * num2;
      case '/': return num1 / num2;
      default: return 0;
    }
  };

  const generateNewProblem = useCallback(() => {
    const operation = generateOperation();
    const { num1, num2 } = generateNumbers(operation);
    const correctAnswer = calculateAnswer(num1, num2, operation);

    const problem = {
      num1,
      num2,
      operation,
      correctAnswer,
      expression: `${num1} ${operation} ${num2} = ?`
    };

    setCurrentProblem(problem);
    setUserAnswer('');
    setFeedback({ message: '', type: '' });
    setIsAnswered(false);
    startTimeRef.current = Date.now();
    
    setTimeout(() => {
      if (inputRef.current && !isChecking && !isAnswered) {
        inputRef.current.focus();
      }
    }, 0);
  }, [difficulty, isChecking, isAnswered]);

  const startTraining = () => {
    setIsStarted(true);
    setStats({
      totalProblems: 0,
      correctAnswers: 0,
      progressToNextLevel: 0,
      responseTimes: [],
      accuracyHistory: [],
    });
    setDifficulty(1);
    setMaxLevelCorrectStreak(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const checkAnswer = () => {
    if (isChecking || isAnswered) return;
    
    if (!currentProblem || !userAnswer.trim()) {
      setFeedback({ message: 'Введите ответ', type: 'error' });
      return;
    }

    const userAnswerNum = parseFloat(userAnswer);
    if (isNaN(userAnswerNum)) {
      setFeedback({ message: 'Введите число', type: 'error' });
      return;
    }

    setIsChecking(true);
    setIsAnswered(true);

    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    const isCorrect = Math.abs(userAnswerNum - currentProblem.correctAnswer) < 0.001;
    
    const currentProgress = stats.progressToNextLevel;
    let newProgress = currentProgress;
    let levelUp = false;

    if (isCorrect && difficulty === maxDifficulty) {
      setMaxLevelCorrectStreak(prev => prev + 1);
    } else if (!isCorrect && difficulty === maxDifficulty) {
      setMaxLevelCorrectStreak(0);
    }

    if (isCorrect) {
      if (currentProgress + 1 === goal) {
        levelUp = true;
        newProgress = 0;
        setMaxLevelCorrectStreak(0);
        setDifficulty(prev => Math.min(prev + 1, maxDifficulty));
      } else {
        newProgress = currentProgress + 1;
      }
    } else {
      newProgress = 0;
    }

    setStats(prev => {
      const newTotal = prev.totalProblems + 1;
      const newCorrectTotal = isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers;
      const newTimes = [...prev.responseTimes, Math.min(timeTaken, 30)].slice(-100);
      const newAccuracyHistory = [...(prev.accuracyHistory || []), isCorrect ? 100 : 0].slice(-20);

      return {
        totalProblems: newTotal,
        correctAnswers: newCorrectTotal,
        progressToNextLevel: newProgress,
        responseTimes: newTimes,
        accuracyHistory: newAccuracyHistory,
      };
    });

    const feedbackMsg = isCorrect 
      ? (levelUp ? 'Отлично! Уровень повышен!' : 'Правильно!') 
      : `Неправильно. Ответ: ${currentProblem.correctAnswer.toFixed(2)}`;

    setFeedback({
      message: feedbackMsg,
      type: isCorrect ? 'success' : 'error'
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsChecking(false);
      setFeedback({ message: '', type: '' });
      generateNewProblem();
    }, levelUp ? 2500 : 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isChecking && !isAnswered) {
      checkAnswer();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isStarted && stats.totalProblems > 0) {
        saveToStorage(stats, difficulty, maxLevelCorrectStreak);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isStarted && stats.totalProblems > 0) {
        saveToStorage(stats, difficulty, maxLevelCorrectStreak);
      }
    };
  }, [stats, difficulty, maxLevelCorrectStreak, isStarted, saveToStorage]);

  if (isLoading) {
    return (
      <div className="trainer-container">
        <div className="start-screen">
          <h1>Загрузка прогресса...</h1>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="trainer-container">
        <div className="start-screen">
          <h1 className="title">Математический тренажёр</h1>
          <p className="start-description">
            Адаптивная сложность: растет каждые 5 правильных ответов подряд
          </p>
          <button className="start-button" onClick={startTraining}>
            Начать тренировку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-container">
      <header className="header">
        <h1 className="title">Математический тренажёр</h1>
        <div className="stats">
          Правильно: <span className="stat-number">{stats.correctAnswers}</span>/
          <span className="stat-total">{stats.totalProblems}</span> 
          (<span className="stat-percent">{Math.round((stats.correctAnswers/stats.totalProblems)*100 || 0)}%</span>)
        </div>
      </header>

      <div className="difficulty-card">
        <span className="difficulty-label">Уровень сложности:</span>
        <div className="difficulty-bar">
          <div 
            className="difficulty-fill" 
            style={{ width: `${(difficulty / maxDifficulty) * 100}%` }}
          />
        </div>
        <span className="difficulty-value">
          {difficulty === maxDifficulty 
            ? `MAX (${maxLevelCorrectStreak})` 
            : difficulty
          }
        </span>
      </div>

      <div className="problem-card">
        <div className="problem-expression">
          {currentProblem?.expression || '...'}
        </div>
      </div>

      <div className="input-section">
        <input
          ref={inputRef}
          type="number"
          step="any"
          className="answer-input"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ваш ответ"
          disabled={isChecking || isAnswered}
          autoFocus
        />
        <button
          className="check-button"
          onClick={checkAnswer}
          disabled={isChecking || isAnswered || !currentProblem}
        >
          {isChecking ? '...' : 'Ответить'}
        </button>
      </div>

      {feedback.message && (
        <div className={`feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="reset-section">
        <button className="reset-button" onClick={startTraining}>
          Новая сессия
        </button>
      </div>
    </div>
  );
};

export default MathTrainer;
