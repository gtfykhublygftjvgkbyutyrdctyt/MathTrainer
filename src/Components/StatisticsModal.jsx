import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Sector
} from 'recharts';
import './StatisticsModal.css';

const StatisticsModal = ({ stats, maxLevelCorrectStreak, onClose }) => {
  const { totalProblems, correctAnswers, responseTimes, accuracyHistory } = stats;
  const accuracy = totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0;
  
  const avgResponseTime = responseTimes.length > 0 
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) 
    : 0;
  const accuracyData = accuracyHistory.map((acc, i) => ({
    name: `№${i + 1}`,
    accuracy: acc,
    isCorrect: acc === 100
  })).slice(-20);

  const responseData = responseTimes.slice(-10).map((time, i) => ({
    name: `№${i + 1}`,
    time: Math.round(time * 10) / 10
  }));

  const pieData = [
    { name: 'Правильно', value: correctAnswers, color: '#4CAF50' },
    { name: 'Неправильно', value: totalProblems - correctAnswers, color: '#F44336' }
  ];

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Статистика</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="stats-grid">
          <div className="metrics-card">
            <div className="metric">
              <span className="metric-value">{accuracy}%</span>
              <span>Точность</span>
            </div>
            <div className="metric">
              <span className="metric-value">{avgResponseTime}с</span>
              <span>Среднее время</span>
            </div>
            <div className="metric">
              <span className="metric-value">{correctAnswers}/{totalProblems}</span>
              <span>Правильно/Всего</span>
            </div>
            <div className="metric">
              <span className="metric-value">{maxLevelCorrectStreak}</span>
              <span>Максимальная серия</span>
            </div>
          </div>

          <div className="chart-card">
            <h3>История точности</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis type="number" domain={['dataMin', 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#4CAF50" 
                  strokeWidth={3}
                  dot={{ fill: '#4CAF50', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
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
          <div className="chart-card">
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
