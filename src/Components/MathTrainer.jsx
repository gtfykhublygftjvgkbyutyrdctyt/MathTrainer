import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './MathTrainer.module.css';

const STORAGE_KEY = 'mathTrainerData';

const MathTrainer = ({
  stats,
  setStats,
  maxLevelCorrectStreak,
  setMaxLevelCorrectStreak,
  settings,
  onOpenSettings,
  isFirstVisit
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

  const [recentProblems, setRecentProblems] = useState([]);
  const [errorPatterns, setErrorPatterns] = useState([]);

  const INFINITY_THRESHOLD = 10;
  const MAX_RECENT_PROBLEMS = 15;
  const MAX_GENERATION_ATTEMPTS = 50;

  const goal = settings?.goal ?? 5;
  const opsConfig = settings?.operationsConfig ?? { basic: true };
  const showSqrtButton = settings?.showSqrtButton ?? false;
  
  const startTimeRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  const TRIG_ANGLES = {
    standard: [
      { deg: 0, rad: '0' },
      { deg: 30, rad: 'π/6' },
      { deg: 45, rad: 'π/4' },
      { deg: 60, rad: 'π/3' },
      { deg: 90, rad: 'π/2' },
      { deg: 120, rad: '2π/3' },
      { deg: 135, rad: '3π/4' },
      { deg: 150, rad: '5π/6' },
      { deg: 180, rad: 'π' },
      { deg: 210, rad: '7π/6' },
      { deg: 225, rad: '5π/4' },
      { deg: 240, rad: '4π/3' },
      { deg: 270, rad: '3π/2' },
      { deg: 300, rad: '5π/3' },
      { deg: 315, rad: '7π/4' },
      { deg: 330, rad: '11π/6' },
      { deg: 360, rad: '2π' },
    ],
    negative: [
      { deg: -30, rad: '-π/6' },
      { deg: -45, rad: '-π/4' },
      { deg: -60, rad: '-π/3' },
      { deg: -90, rad: '-π/2' },
      { deg: -120, rad: '-2π/3' },
      { deg: -135, rad: '-3π/4' },
      { deg: -150, rad: '-5π/6' },
      { deg: -180, rad: '-π' },
    ],
    extended: [
      { deg: 390, rad: '13π/6' },
      { deg: 405, rad: '9π/4' },
      { deg: 420, rad: '7π/3' },
      { deg: 450, rad: '5π/2' },
      { deg: 480, rad: '8π/3' },
      { deg: 540, rad: '3π' },
      { deg: 630, rad: '7π/2' },
      { deg: 720, rad: '4π' },
    ],
    egeSpecial: [
      { deg: 15, rad: 'π/12' },
      { deg: 75, rad: '5π/12' },
      { deg: 105, rad: '7π/12' },
      { deg: 165, rad: '11π/12' },
      { deg: 195, rad: '13π/12' },
      { deg: 255, rad: '17π/12' },
      { deg: 285, rad: '19π/12' },
      { deg: 345, rad: '23π/12' },
    ]
  };

  const NICE_TRIG_VALUES = [
    0, 1, -1, 0.5, -0.5,
    Math.sqrt(2) / 2, -Math.sqrt(2) / 2,
    Math.sqrt(3) / 2, -Math.sqrt(3) / 2,
    Math.sqrt(3), -Math.sqrt(3),
    Math.sqrt(3) / 3, -Math.sqrt(3) / 3,
    1 / Math.sqrt(3), -1 / Math.sqrt(3),
    (Math.sqrt(6) - Math.sqrt(2)) / 4, -(Math.sqrt(6) - Math.sqrt(2)) / 4,
    (Math.sqrt(6) + Math.sqrt(2)) / 4, -(Math.sqrt(6) + Math.sqrt(2)) / 4,
    2 - Math.sqrt(3), -(2 - Math.sqrt(3)),
    2 + Math.sqrt(3), -(2 + Math.sqrt(3)),
  ];

  const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getRandomFromArray = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const weightedRandomChoice = (items, weights) => {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    return items[items.length - 1];
  };

  const isNiceTrigValue = useCallback((value) => {
    return NICE_TRIG_VALUES.some(v => Math.abs(value - v) < 0.0001);
  }, []);

  const formatTrigAnswer = (value) => {
    const epsilon = 0.0001;

    if (Math.abs(value) < epsilon) return '0';
    if (Math.abs(value - 1) < epsilon) return '1';
    if (Math.abs(value + 1) < epsilon) return '-1';
    if (Math.abs(value - 0.5) < epsilon) return '1/2';
    if (Math.abs(value + 0.5) < epsilon) return '-1/2';

    const sqrt2_2 = Math.sqrt(2) / 2;
    const sqrt3_2 = Math.sqrt(3) / 2;
    const sqrt3 = Math.sqrt(3);
    const sqrt3_3 = Math.sqrt(3) / 3;

    if (Math.abs(value - sqrt2_2) < epsilon) return '√2/2';
    if (Math.abs(value + sqrt2_2) < epsilon) return '-√2/2';
    if (Math.abs(value - sqrt3_2) < epsilon) return '√3/2';
    if (Math.abs(value + sqrt3_2) < epsilon) return '-√3/2';
    if (Math.abs(value - sqrt3) < epsilon) return '√3';
    if (Math.abs(value + sqrt3) < epsilon) return '-√3';
    if (Math.abs(value - sqrt3_3) < epsilon) return '√3/3';
    if (Math.abs(value + sqrt3_3) < epsilon) return '-√3/3';

    const sin15 = (Math.sqrt(6) - Math.sqrt(2)) / 4;
    const sin75 = (Math.sqrt(6) + Math.sqrt(2)) / 4;
    const tg15 = 2 - Math.sqrt(3);
    const tg75 = 2 + Math.sqrt(3);

    if (Math.abs(value - sin15) < epsilon) return '(√6-√2)/4';
    if (Math.abs(value + sin15) < epsilon) return '-(√6-√2)/4';
    if (Math.abs(value - sin75) < epsilon) return '(√6+√2)/4';
    if (Math.abs(value + sin75) < epsilon) return '-(√6+√2)/4';
    if (Math.abs(value - tg15) < epsilon) return '2-√3';
    if (Math.abs(value + tg15) < epsilon) return '-(2-√3)';
    if (Math.abs(value - tg75) < epsilon) return '2+√3';
    if (Math.abs(value + tg75) < epsilon) return '-(2+√3)';

    return value.toFixed(4);
  };

  const parseAnswer = (answer) => {
    if (!answer || typeof answer !== 'string') return NaN;
    
    let processed = answer.trim();
    
    processed = processed.replace(/√(\d+)/g, (match, num) => {
      return Math.sqrt(parseFloat(num));
    });
    
    try {
      if (processed.includes('/')) {
        const parts = processed.split('/');
        if (parts.length === 2) {
          const numerator = parseFloat(parts[0]) || eval(parts[0]);
          const denominator = parseFloat(parts[1]) || eval(parts[1]);
          if (denominator !== 0) {
            return numerator / denominator;
          }
        }
      }
      
      const result = parseFloat(processed);
      if (!isNaN(result)) return result;
      return eval(processed);
    } catch {
      return NaN;
    }
  };

  const isSimilarProblem = useCallback((p1, p2) => {
    if (!p1 || !p2) return false;

    if (p1.num1 === p2.num1 && p1.num2 === p2.num2 && p1.operation === p2.operation) {
      return true;
    }

    if (['+', '*'].includes(p1.operation) && p1.operation === p2.operation) {
      if (p1.num1 === p2.num2 && p1.num2 === p2.num1) return true;
    }

    if (['sin', 'cos', 'tg', 'ctg'].includes(p1.operation) && p1.operation === p2.operation) {
      if (Math.abs(p1.correctAnswer - p2.correctAnswer) < 0.0001) return true;
    }

    if (p1.operation === p2.operation && !['sin', 'cos', 'tg', 'ctg'].includes(p1.operation)) {
      const diff1 = Math.abs(p1.num1 - p2.num1);
      const diff2 = Math.abs((p1.num2 || 0) - (p2.num2 || 0));
      if (diff1 <= 1 && diff2 <= 1) return true;
    }

    return false;
  }, []);

  const isValidProblem = useCallback((num1, num2, operation, answer) => {
    if (!Number.isFinite(answer)) return false;

    const maxAnswer = difficulty > INFINITY_THRESHOLD ? 1000000 : 10000;

    if (Math.abs(answer) > maxAnswer) return false;
    if (operation === '/' && !Number.isInteger(answer)) return false;
    if (operation === 'sqrt' && !Number.isInteger(answer)) return false;
    if (operation === 'log' && (!Number.isInteger(answer) || answer <= 0)) return false;

    if (['sin', 'cos', 'tg', 'ctg'].includes(operation)) {
      if (!isNiceTrigValue(answer)) return false;
    }

    return true;
  }, [difficulty, isNiceTrigValue]);

  const formatNumber = (num) => {
    if (Math.abs(num) >= 10000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  const insertSqrt = () => {
    setUserAnswer(prev => prev + '√');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getPossibleOperations = useCallback(() => {
    let ops = [];
    if (opsConfig.basic) {
      ops = ops.concat(['+', '-', '*', '/']);
    }
    if (opsConfig.powers) ops.push('power');
    if (opsConfig.log) ops.push('log');
    if (opsConfig.sqrt) ops.push('sqrt');
    if (opsConfig.trig?.enabled) {
      if (opsConfig.trig.sin) ops.push('sin');
      if (opsConfig.trig.cos) ops.push('cos');
      if (opsConfig.trig.tg) ops.push('tg');
      if (opsConfig.trig.ctg) ops.push('ctg');
    }
    return ops.length > 0 ? ops : ['+', '-', '*', '/'];
  }, [opsConfig]);

  const generateOperation = useCallback(() => {
    const possibleOps = getPossibleOperations();

    if (possibleOps.length === 1) return possibleOps[0];

    const recentOpsCount = {};
    possibleOps.forEach(op => recentOpsCount[op] = 0);
    recentProblems.slice(-8).forEach(p => {
      if (recentOpsCount[p.operation] !== undefined) {
        recentOpsCount[p.operation]++;
      }
    });

    const weights = possibleOps.map(op => {
      let weight = 1;

      weight *= Math.max(0.2, 1 - recentOpsCount[op] * 0.25);

      const errorCount = errorPatterns.filter(e => e.operation === op).length;
      weight *= 1 + errorCount * 0.3;

      const isBasic = ['+', '-', '*', '/'].includes(op);
      const difficultyWeight = Math.min(difficulty / 20, 1);

      if (isBasic) {
        weight *= Math.max(0.5, 1.5 * (1 - difficultyWeight * 0.7));
      } else {
        weight *= 0.5 + difficultyWeight * 1.5;
      }

      return weight;
    });

    return weightedRandomChoice(possibleOps, weights);
  }, [difficulty, getPossibleOperations, recentProblems, errorPatterns]);

  const getDifficultyConfig = useCallback((level) => {
    const baseConfigs = {
      1: { range: [1, 10], multRange: [2, 5], divRange: [2, 4] },
      2: { range: [1, 15], multRange: [2, 6], divRange: [2, 5] },
      3: { range: [5, 25], multRange: [2, 8], divRange: [2, 6] },
      4: { range: [10, 35], multRange: [3, 9], divRange: [2, 7] },
      5: { range: [15, 50], multRange: [3, 10], divRange: [3, 8] },
      6: { range: [20, 70], multRange: [4, 11], divRange: [3, 9] },
      7: { range: [25, 90], multRange: [5, 12], divRange: [4, 10] },
      8: { range: [30, 120], multRange: [6, 13], divRange: [5, 11] },
      9: { range: [40, 150], multRange: [7, 15], divRange: [6, 12] },
      10: { range: [50, 200], multRange: [8, 20], divRange: [7, 15] },
    };

    if (level <= 10) {
      return { ...baseConfigs[level], isInfinityMode: false };
    }

    const infinityLevel = level - INFINITY_THRESHOLD;
    const growthFactor = Math.log2(infinityLevel + 2);

    const minNum = Math.floor(50 + infinityLevel * 10 * growthFactor);
    const maxNum = Math.floor(200 + infinityLevel * 50 * growthFactor);

    const minMult = Math.min(8 + Math.floor(infinityLevel / 2), 50);
    const maxMult = Math.min(20 + infinityLevel * 2, 100);

    const minDiv = Math.min(7 + Math.floor(infinityLevel / 2), 30);
    const maxDiv = Math.min(15 + infinityLevel, 50);

    return {
      range: [minNum, maxNum],
      multRange: [minMult, maxMult],
      divRange: [minDiv, maxDiv],
      isInfinityMode: true,
      infinityLevel,
      specialProbability: Math.min(0.1 + infinityLevel * 0.02, 0.5),
      maxPowerBase: Math.min(20 + infinityLevel * 2, 100),
      maxPowerExp: Math.min(6 + Math.floor(infinityLevel / 3), 10),
      maxLogBase: Math.min(10 + infinityLevel, 30),
    };
  }, []);

  const generateTrigProblem = useCallback((operation) => {
    const config = getDifficultyConfig(difficulty);

    let availableCategories = ['standard'];

    if (difficulty >= 3) {
      availableCategories.push('negative');
    }
    if (difficulty >= 5) {
      availableCategories.push('extended');
    }
    if (difficulty >= 7) {
      availableCategories.push('egeSpecial');
    }

    const categoryWeights = {
      standard: 1,
      negative: difficulty >= 5 ? 0.8 : 0.4,
      extended: difficulty >= 7 ? 0.7 : 0.3,
      egeSpecial: difficulty >= 8 ? 0.5 : 0.2,
    };

    const weights = availableCategories.map(c => categoryWeights[c]);
    const category = weightedRandomChoice(availableCategories, weights);

    let angles = [...TRIG_ANGLES[category]];

    angles = angles.filter(angle => {
      const deg = angle.deg;
      const normalizedDeg = ((deg % 360) + 360) % 360;

      if (operation === 'tg') {
        return normalizedDeg !== 90 && normalizedDeg !== 270;
      }
      if (operation === 'ctg') {
        return normalizedDeg !== 0 && normalizedDeg !== 180;
      }
      return true;
    });

    if (difficulty <= 2) {
      angles = angles.filter(a => a.deg >= 0 && a.deg <= 90);
    } else if (difficulty <= 4) {
      angles = angles.filter(a => a.deg >= -90 && a.deg <= 180);
    } else if (difficulty <= 6) {
      angles = angles.filter(a => a.deg >= -180 && a.deg <= 360);
    }

    if (angles.length === 0) {
      angles = TRIG_ANGLES.standard.filter(a => a.deg >= 0 && a.deg <= 90);
    }

    const selectedAngle = getRandomFromArray(angles);

    const useRadians = difficulty >= 4 && (
      difficulty >= 7 ? Math.random() < 0.7 : Math.random() < 0.4
    );

    const toRad = (deg) => deg * Math.PI / 180;
    let answer;
    const radians = toRad(selectedAngle.deg);

    switch (operation) {
      case 'sin': answer = Math.sin(radians); break;
      case 'cos': answer = Math.cos(radians); break;
      case 'tg': answer = Math.tan(radians); break;
      case 'ctg': answer = 1 / Math.tan(radians); break;
      default: answer = 0;
    }

    let expression;
    if (useRadians && selectedAngle.rad) {
      expression = `${operation}(${selectedAngle.rad})`;
    } else {
      expression = `${operation}(${selectedAngle.deg}°)`;
    }

    return {
      num1: selectedAngle.deg,
      num2: null,
      operation,
      correctAnswer: answer,
      expression: `${expression} = ?`,
      angleData: selectedAngle,
      useRadians,
      niceAnswer: formatTrigAnswer(answer),
    };
  }, [difficulty, getDifficultyConfig]);

  const generateProblemData = useCallback((operation) => {
    if (['sin', 'cos', 'tg', 'ctg'].includes(operation)) {
      return generateTrigProblem(operation);
    }

    const config = getDifficultyConfig(difficulty);
    const [minNum, maxNum] = config.range;
    const [minMult, maxMult] = config.multRange;
    const [minDiv, maxDiv] = config.divRange;
    const isInfinity = config.isInfinityMode;

    let num1, num2;

    switch (operation) {
      case '+': {
        if (isInfinity && Math.random() < config.specialProbability) {
          const magnitude = Math.pow(10, getRandomInt(2, 4));
          num1 = getRandomInt(1, 9) * magnitude + getRandomInt(0, magnitude - 1);
          num2 = getRandomInt(1, 9) * magnitude + getRandomInt(0, magnitude - 1);
        } else {
          const targetSum = getRandomInt(minNum * 2, maxNum * 2);
          num1 = getRandomInt(Math.max(1, targetSum - maxNum), Math.min(targetSum - 1, maxNum));
          num2 = targetSum - num1;
        }

        if (Math.random() < 0.3 && difficulty >= 3) {
          const roundTo = difficulty >= 6 ? 100 : 10;
          if (Math.random() < 0.5) {
            num1 = Math.round(num1 / roundTo) * roundTo || roundTo;
          } else {
            num2 = Math.round(num2 / roundTo) * roundTo || roundTo;
          }
        }
        break;
      }

      case '-': {
        if (isInfinity && Math.random() < config.specialProbability) {
          const magnitude = Math.pow(10, getRandomInt(3, 5));
          num1 = getRandomInt(5, 9) * magnitude + getRandomInt(0, Math.floor(magnitude / 10));
          num2 = getRandomInt(1, 4) * magnitude + getRandomInt(Math.floor(magnitude / 2), magnitude - 1);
        } else {
          const targetDiff = getRandomInt(Math.max(1, minNum), maxNum);
          num2 = getRandomInt(minNum, Math.max(minNum, maxNum - targetDiff));
          num1 = num2 + targetDiff;
        }

        if (difficulty >= 4 && (num1 - num2) < 5) {
          num2 = getRandomInt(minNum + 5, maxNum);
          num1 = num2 + getRandomInt(5, Math.min(50, maxNum));
        }
        break;
      }

      case '*': {
        if (isInfinity && Math.random() < config.specialProbability) {
          const specialType = getRandomInt(1, 3);
          switch (specialType) {
            case 1:
              num1 = getRandomFromArray([25, 50, 125, 250]);
              num2 = getRandomInt(4, 40);
              break;
            case 2:
              num1 = getRandomInt(11, 99);
              num2 = getRandomInt(11, 99);
              break;
            case 3:
              num1 = getRandomInt(96, 104);
              num2 = getRandomInt(10, 50);
              break;
            default:
              num1 = getRandomInt(minMult, maxMult);
              num2 = getRandomInt(minMult, maxMult);
          }
        } else {
          num1 = getRandomInt(minMult, maxMult);
          num2 = getRandomInt(minMult, maxMult);

          if (difficulty >= 5 && Math.random() < 0.3) {
            if (Math.random() < 0.5) {
              num1 = getRandomInt(10, 12);
            } else {
              num2 = getRandomInt(10, 12);
            }
          }

          if (difficulty >= 7 && Math.random() < 0.2) {
            num1 = getRandomInt(2, 9) * 10;
            num2 = getRandomInt(2, 9);
          }
        }
        break;
      }

      case '/': {
        if (isInfinity && Math.random() < config.specialProbability) {
          num2 = getRandomFromArray([25, 50, 125, 250, 15, 12, 11]);
          const quotient = getRandomInt(10, 100);
          num1 = num2 * quotient;
        } else {
          num2 = getRandomInt(minDiv, maxDiv);
          const maxQuotient = isInfinity ? 100 : 30;
          const quotient = getRandomInt(minDiv, Math.min(maxDiv * 2, maxQuotient));
          num1 = num2 * quotient;
        }

        if (difficulty >= 6 && Math.random() < 0.25 && !isInfinity) {
          num2 = getRandomInt(10, 12);
          num1 = num2 * getRandomInt(2, 12);
        }
        break;
      }

      case 'power': {
        const minBase = Math.min(2 + Math.floor(difficulty / 2), 10);
        const maxBase = isInfinity ? config.maxPowerBase : 2 + difficulty * 2;
        const minExp = Math.min(2 + Math.floor(difficulty / 4), 4);
        const maxExp = isInfinity ? config.maxPowerExp : Math.min(2 + Math.floor(difficulty / 2), 6);
        const maxResult = isInfinity ? 1000000 : 500 + difficulty * 200;

        const possibleBases = [];

        for (let base = minBase; base <= maxBase; base++) {
          for (let exp = minExp; exp <= maxExp; exp++) {
            if (Math.pow(base, exp) <= maxResult) {
              possibleBases.push({ base, exp });
            }
          }
        }

        const chosen = getRandomFromArray(possibleBases) || { base: minBase, exp: minExp };
        num1 = chosen.base;
        num2 = chosen.exp;
        break;
      }

      case 'sqrt': {
        const minRoot = Math.min(2 + Math.floor(difficulty / 2), 15);
        const maxRoot = isInfinity
          ? Math.min(50 + config.infinityLevel * 5, 500)
          : Math.min(5 + difficulty * 2, 30);

        const root = getRandomInt(minRoot, maxRoot);
        num1 = root * root;
        num2 = null;
        break;
      }

      case 'log': {
        const maxBase = isInfinity ? config.maxLogBase : Math.min(2 + difficulty, 10);
        const maxExp = isInfinity ? 8 : Math.min(2 + Math.floor(difficulty / 2), 6);

        const possibleLogs = [];

        for (let base = 2; base <= maxBase; base++) {
          for (let exp = 2; exp <= maxExp; exp++) {
            const value = Math.pow(base, exp);
            if (value <= (isInfinity ? 10000000 : 10000)) {
              possibleLogs.push({ base, value, answer: exp });
            }
          }
        }

        const chosen = getRandomFromArray(possibleLogs) || { base: 2, value: 8, answer: 3 };
        num1 = chosen.base;
        num2 = chosen.value;
        break;
      }

      default:
        num1 = getRandomInt(minNum, maxNum);
        num2 = getRandomInt(minNum, maxNum);
    }

    return { num1, num2 };
  }, [difficulty, getDifficultyConfig, generateTrigProblem]);

  // ==================== РАСЧЁТ ОТВЕТА ====================

  const calculateAnswer = (num1, num2, operation) => {
    const toRad = (deg) => deg * Math.PI / 180;
    switch (operation) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '*': return num1 * num2;
      case '/': return num1 / num2;
      case 'power': return Math.pow(num1, num2);
      case 'log': return Math.log(num2) / Math.log(num1);
      case 'sqrt': return Math.sqrt(num1);
      case 'sin': return Math.sin(toRad(num1));
      case 'cos': return Math.cos(toRad(num1));
      case 'tg': return Math.tan(toRad(num1));
      case 'ctg': return 1 / Math.tan(toRad(num1));
      default: return 0;
    }
  };

  const generateNewProblem = useCallback(() => {
    let problem = null;
    let attempts = 0;

    while (attempts < MAX_GENERATION_ATTEMPTS) {
      attempts++;

      const operation = generateOperation();

      if (['sin', 'cos', 'tg', 'ctg'].includes(operation)) {
        const trigProblem = generateProblemData(operation);

        if (!isValidProblem(trigProblem.num1, trigProblem.num2, operation, trigProblem.correctAnswer)) {
          continue;
        }

        const isDuplicate = recentProblems.some(p => isSimilarProblem(p, trigProblem));
        if (isDuplicate && attempts < MAX_GENERATION_ATTEMPTS - 5) {
          continue;
        }

        problem = trigProblem;
        break;
      }

      const { num1, num2 } = generateProblemData(operation);
      const correctAnswer = calculateAnswer(num1, num2, operation);

      if (!isValidProblem(num1, num2, operation, correctAnswer)) {
        continue;
      }

      const candidateProblem = { num1, num2, operation, correctAnswer };

      const isDuplicate = recentProblems.some(p => isSimilarProblem(p, candidateProblem));
      if (isDuplicate && attempts < MAX_GENERATION_ATTEMPTS - 5) {
        continue;
      }

      const n1 = formatNumber(num1);
      const n2 = num2 !== null ? formatNumber(num2) : null;

      let expression;
      if (operation === 'power') {
        expression = `${n1}<sup>${n2}</sup> = ?`;
      } else if (operation === 'log') {
        expression = `log<sub>${n1}</sub>(${n2}) = ?`;
      } else if (operation === 'sqrt') {
        expression = `√${n1} = ?`;
      } else {
        expression = `${n1} ${operation} ${n2} = ?`;
      }

      problem = {
        num1,
        num2,
        operation,
        correctAnswer,
        expression
      };

      break;
    }

    if (!problem) {
      const num1 = getRandomInt(1, 10);
      const num2 = getRandomInt(1, 10);
      problem = {
        num1,
        num2,
        operation: '+',
        correctAnswer: num1 + num2,
        expression: `${num1} + ${num2} = ?`
      };
    }

    setRecentProblems(prev => {
      const updated = [...prev, problem];
      return updated.slice(-MAX_RECENT_PROBLEMS);
    });

    setCurrentProblem(problem);
    setUserAnswer('');
    setFeedback({ message: '', type: '' });
    setIsAnswered(false);
    startTimeRef.current = Date.now();

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [generateOperation, generateProblemData, isValidProblem, isSimilarProblem, recentProblems]);

  const recordError = useCallback((problem) => {
    setErrorPatterns(prev => {
      const updated = [...prev, {
        operation: problem.operation,
        num1: problem.num1,
        num2: problem.num2,
        timestamp: Date.now()
      }];
      return updated.slice(-20);
    });
  }, []);

  useEffect(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    setErrorPatterns(prev => prev.filter(e => e.timestamp > dayAgo));
  }, []);

  useEffect(() => {
    if (isStarted && !currentProblem) {
      generateNewProblem();
    }
  }, [isStarted, currentProblem, generateNewProblem]);

  useEffect(() => {
    if (isStarted && prevOpsConfig && JSON.stringify(prevOpsConfig) !== JSON.stringify(opsConfig)) {
      setRecentProblems([]);
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
    setMaxLevelCorrectStreak(0);
    setRecentProblems([]);
    setErrorPatterns([]);
    localStorage.removeItem(STORAGE_KEY);
    setCurrentProblem(null);
  };

  const checkAnswer = () => {
    if (isChecking || isAnswered) return;

    if (!currentProblem || !userAnswer.trim()) {
      setFeedback({ message: 'Введите ответ', type: 'error' });
      return;
    }

    const userAnswerNum = parseAnswer(userAnswer);
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

    let newStreak = 0;
    if (isCorrect) {
      newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);

      if (newStreak > maxLevelCorrectStreak) {
        setMaxLevelCorrectStreak(newStreak);
      }
    } else {
      setCurrentStreak(0);
      recordError(currentProblem);
    }

    if (isCorrect) {
      if (currentProgress + 1 === goal) {
        levelUp = true;
        newProgress = 0;
        setDifficulty(prev => prev + 1);
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

    let correctDisplay;
    const isTrig = ['sin', 'cos', 'tg', 'ctg'].includes(currentProblem.operation);

    if (isTrig && currentProblem.niceAnswer) {
      correctDisplay = currentProblem.niceAnswer;
    } else {
      correctDisplay = currentProblem.correctAnswer;
      const isFloat = !Number.isInteger(correctDisplay);
      if (isFloat) {
        correctDisplay = correctDisplay.toFixed(3);
      }
    }

    const isFloat = !Number.isInteger(currentProblem.correctAnswer);
    const approxSymbol = isFloat && !isTrig ? ' ≈' : '';

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

  const getDifficultyPercent = () => {
    if (difficulty <= INFINITY_THRESHOLD) {
      return (difficulty / INFINITY_THRESHOLD) * 100;
    }
    return 100;
  };


  if (isLoading) {
    return (
      <div className={styles.trainerContainer}>
        <div className={styles.startScreen}>
          <h1>Загрузка прогресса...</h1>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className={styles.trainerContainer}>
        <div className={styles.startScreen}>
          <h1 className={styles.title}>Математический тренажёр</h1>

          {isFirstVisit ? (
            <div className={styles.welcomeMessage}>
              <p className={styles.welcomeText}>Добро пожаловать!</p>
              <p className={styles.welcomeDescription}>
                Рекомендуем сначала настроить тренажёр под себя.
              </p>
            </div>
          ) : (
            <p className={styles.startDescription}>
              Нажмите в правый верхний угол для дополнительных функций.
            </p>
          )}

          <div className={styles.startButtons}>
            <button className={styles.startButton} onClick={startTraining}>
              Начать тренировку
            </button>
            <button className={styles.settingsButtonStart} onClick={onOpenSettings}>
              Настройки
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.trainerContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Математический тренажёр</h1>
        <div className={styles.stats}>
          Правильно: <span className={styles.statNumber}>{stats.correctAnswers}</span>/
          <span className={styles.statTotal}>{stats.totalProblems}</span>
          (<span className={styles.statPercent}>{Math.round((stats.correctAnswers / stats.totalProblems) * 100 || 0)}%</span>)
        </div>
      </header>

      <div className={styles.difficultyCard}>
        <span className={styles.difficultyLabel}>Уровень сложности:</span>
        <div className={styles.difficultyBar}>
          <div
            className={`${styles.difficultyFill} ${difficulty > INFINITY_THRESHOLD ? styles.infinityMode : ''}`}
            style={{ width: `${getDifficultyPercent()}%` }}
          />
        </div>
        <span className={styles.difficultyValue}>
          {difficulty >= INFINITY_THRESHOLD
            ? `MAX (${currentStreak})`
            : difficulty
          }
        </span>
      </div>

      <div className={styles.problemCard}>
        <div
          className={styles.problemExpression}
          dangerouslySetInnerHTML={{ __html: currentProblem?.expression || '...' }}
        />
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={styles.answerInput}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ваш ответ"
            disabled={isChecking || isAnswered}
            autoFocus
          />
          {showSqrtButton && (
            <button
              type="button"
              className={styles.sqrtButton}
              onClick={insertSqrt}
              disabled={isChecking || isAnswered}
              aria-label="Вставить символ корня"
            >
              √
            </button>
          )}
        </div>
        <button
          className={styles.checkButton}
          onClick={checkAnswer}
          disabled={isChecking || isAnswered || !currentProblem}
        >
          {isChecking ? '...' : 'Ответить'}
        </button>
      </div>

      {feedback.message && (
        <div className={`${styles.feedback} ${styles[feedback.type]}`}>
          {feedback.message}
        </div>
      )}

      <div className={styles.resetSection}>
        <button className={styles.resetButton} onClick={startTraining}>
          Новая сессия
        </button>
      </div>
    </div>
  );
};

export default MathTrainer;