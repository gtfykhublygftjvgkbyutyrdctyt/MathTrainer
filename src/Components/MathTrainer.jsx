import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MathTrainer.css';

const STORAGE_KEY = 'mathTrainerData';

const MathTrainer = ({
  stats,
  setStats,
  maxLevelCorrectStreak,
  setMaxLevelCorrectStreak,
  settings
}) => {
  const [difficulty, setDifficulty] = useState(1);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [isStarted, setIsStarted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [prevOpsConfig, setPrevOpsConfig] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  const maxDifficulty = 10;
  const goal = settings?.goal ?? 5;
  const opsConfig = settings?.operationsConfig ?? { basic: true };
  const startTimeRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getMinNumForLevel = (level) => {
    return Math.max(1, (level - 1) * 5 + 1);
  };

  const getPossibleOperations = () => {
    let ops = [];
    if (opsConfig.basic) {
      ops = ops.concat(['+', '-', '*', '/']);
    }
    if (opsConfig.powers) ops.push('power');
    if (opsConfig.log) ops.push('log');
    if (opsConfig.sqrt) ops.push('sqrt');
    if (opsConfig.trig?.enabled) {
      const trigFuncs = [];
      if (opsConfig.trig.sin) trigFuncs.push('sin');
      if (opsConfig.trig.cos) trigFuncs.push('cos');
      if (opsConfig.trig.tan) trigFuncs.push('tan');
      if (opsConfig.trig.cot) trigFuncs.push('cot');
      if (trigFuncs.length > 0) {
        ops = ops.concat(trigFuncs);
      }
    }
    return ops.length > 0 ? ops : ['+', '-', '*', '/'];
  };

  const generateOperation = () => {
    const possibleOps = getPossibleOperations();
    const weight = difficulty / maxDifficulty;
    const rand = Math.random();
    if (opsConfig.basic && rand < 0.7 * (1 - weight)) {
      const basicOps = possibleOps.filter(op => ['+', '-', '*', '/'].includes(op));
      return basicOps[getRandomInt(0, basicOps.length - 1)];
    }
    return possibleOps[getRandomInt(0, possibleOps.length - 1)];
  };

  const generateProblemData = (operation) => {
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
      case 'power':
        num1 = getRandomInt(2, Math.min(2 + difficulty * 2, 20)); // base
        num2 = getRandomInt(1, Math.min(1 + Math.floor(difficulty / 2), 6)); // exp
        break;
      case 'log':
        num1 = getRandomInt(2, Math.min(2 + difficulty, 10)); // base
        const exp = getRandomInt(2, Math.min(2 + difficulty, 8));
        num2 = Math.pow(num1, exp); // arg
        break;
      case 'sqrt':
        const root = getRandomInt(currentMinNum, maxNum1);
        num1 = root * root; // perfect square
        num2 = null;
        break;
      case 'sin':
      case 'cos':
      case 'tan':
      case 'cot':
        const baseAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
        num1 = baseAngles[getRandomInt(0, baseAngles.length - 1)] + (difficulty > 5 ? getRandomInt(-30, 30) : 0);
        num2 = null;
        break;
      default:
        num1 = getRandomInt(currentMinNum, maxNum1);
        num2 = getRandomInt(currentMinNum, maxNum2);
    }
    return { num1, num2 };
  };

  const calculateAnswer = (num1, num2, operation) => {
    const toRad = (deg) => deg * Math.PI / 180;
    switch(operation) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '*': return num1 * num2;
      case '/': return num1 / num2;
      case 'power': return Math.pow(num1, num2);
      case 'log': return Math.log(num2) / Math.log(num1);
      case 'sqrt': return Math.sqrt(num1);
      case 'sin': return Math.sin(toRad(num1));
      case 'cos': return Math.cos(toRad(num1));
      case 'tan': return Math.tan(toRad(num1));
      case 'cot': return 1 / Math.tan(toRad(num1));
      default: return 0;
    }
  };

  const generateNewProblem = useCallback(() => {
    const operation = generateOperation();
    const { num1, num2 } = generateProblemData(operation);
    const correctAnswer = calculateAnswer(num1, num2, operation);
    const expression = `${num1} ${operation} ${num2} = ?`;
    let problem = {
      num1,
      num2,
      operation,
      correctAnswer,
      expression: expression
    };
    if (operation === 'power') {
      problem.expression = `${num1}<sup>${num2}</sup> = ?`;
    } else if (operation === 'log') {
      problem.expression = `log<sub>${num1}</sub>(${num2}) = ?`;
    } else if (operation === 'sqrt') {
      problem.expression = `&radic;${num1} = ?`;
    } else if (['sin', 'cos', 'tan', 'cot'].includes(operation)) {
      problem.expression = `${operation}(${num1}°) = ?`;
    }
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
  }, [difficulty, isChecking, isAnswered, opsConfig]);

  useEffect(() => {
    if (isStarted && !currentProblem) {
      generateNewProblem();
    }
  }, [isStarted, difficulty, currentProblem, generateNewProblem]);

  useEffect(() => {
    if (isStarted && prevOpsConfig && JSON.stringify(prevOpsConfig) !== JSON.stringify(opsConfig)) {
      generateNewProblem();
    }
    setPrevOpsConfig(opsConfig);
  }, [opsConfig, isStarted, generateNewProblem, prevOpsConfig]);

  useEffect(() => {
    if (inputRef.current && !isChecking && !isAnswered) {
      inputRef.current.focus();
    }
  }, [currentProblem, isChecking, isAnswered]);

  const saveToStorage = useCallback((statsData, diff, maxStreak, currStreak, problem) => {
    try {
      const data = {
        stats: statsData,
        difficulty: diff,
        maxLevelCorrectStreak: maxStreak,
        currentStreak: currStreak, 
        currentProblem: problem,
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
      setCurrentStreak(savedData.currentStreak || 0);
      setCurrentProblem(savedData.currentProblem || null);
      setIsStarted(true);
    }
    setIsLoading(false);
  }, [loadFromStorage, setStats, setMaxLevelCorrectStreak]);

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
    setCurrentStreak(0); 
    setMaxLevelCorrectStreak(0), 
    localStorage.removeItem(STORAGE_KEY);
    setCurrentProblem(null);
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

    // --- ИСПРАВЛЕННАЯ ЛОГИКА СЕРИИ ---
    let newStreak = 0;
    if (isCorrect) {
      // Увеличиваем текущую серию
      newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      
      // Если побили рекорд, обновляем его
      if (newStreak > maxLevelCorrectStreak) {
        setMaxLevelCorrectStreak(newStreak);
      }
    } else {
      // При ошибке сбрасываем только текущую серию
      setCurrentStreak(0);
      // Рекорд maxLevelCorrectStreak НЕ сбрасываем
    }
    // ---------------------------------

    if (isCorrect) {
      if (currentProgress + 1 === goal) {
        levelUp = true;
        newProgress = 0;
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
    let correctDisplay = currentProblem.correctAnswer;
    const isFloat = !Number.isInteger(correctDisplay);
    if (isFloat) {
      correctDisplay = correctDisplay.toFixed(3);
    }
    const approxSymbol = isFloat ? ' ≈' : '';
    const feedbackMsg = isCorrect
      ? (levelUp ? 'Отлично! Уровень повышен!' : 'Правильно!')
      : `Неправильно. Ответ${approxSymbol}: ${correctDisplay}`;
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
        // Добавили currentStreak в сохранение
        saveToStorage(stats, difficulty, maxLevelCorrectStreak, currentStreak, currentProblem);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isStarted && stats.totalProblems > 0) {
        saveToStorage(stats, difficulty, maxLevelCorrectStreak, currentStreak, currentProblem);
      }
    };
  }, [stats, difficulty, maxLevelCorrectStreak, currentStreak, currentProblem, isStarted, saveToStorage]);

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
            Нажмите в правый верхний угол, для дополнительных функций.
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
        <div className="problem-expression" dangerouslySetInnerHTML={{ __html: currentProblem?.expression || '...' }} />
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