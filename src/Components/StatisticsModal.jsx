import React, { useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import styles from './StatisticsModal.module.css';

const StatisticsModal = ({ stats, maxLevelCorrectStreak, onClose }) => {
  const { totalProblems, correctAnswers, responseTimes, accuracyHistory, levelStats } = stats;
  const accuracy = totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0;

  const avgResponseTime = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
    : 0;

  const responseData = responseTimes.slice(-10).map((time, i) => ({
    name: `№${i + 1}`,
    time: Math.round(time * 10) / 10
  }));

  const pieData = [
    { name: 'Правильно', value: correctAnswers, color: '#4CAF50' },
    { name: 'Неправильно', value: totalProblems - correctAnswers, color: '#F44336' }
  ];

  const levelTimeData = [];
  for (let lvl = 1; lvl <= 10; lvl++) {
    const ls = levelStats?.[lvl.toString()] || { totalTime: 0, count: 0 };
    const avg = ls.count > 0 ? ls.totalTime / ls.count : 0;
    levelTimeData.push({
      level: `Ур. ${lvl}`,
      averageTime: parseFloat(avg.toFixed(2))
    });
  }

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div className={styles.statsModalOverlay} onClick={onClose}>
      <div className={styles.statsModal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Статистика</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.metricsCard}>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{accuracy}%</span>
              <span>Точность</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{avgResponseTime}с</span>
              <span>Среднее время</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{correctAnswers}/{totalProblems}</span>
              <span>Правильно/Всего</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{maxLevelCorrectStreak}</span>
              <span>Максимальная серия</span>
            </div>
          </div>
          <div className={styles.chartCard}>
            <h3>Время реакции (последние 10)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={responseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="time" fill="#2196F3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartCard}>
            <h3>Общая статистика</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;