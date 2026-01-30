import React, { useState } from 'react';
import './BurgerMenu.css';

const BurgerMenu = ({ onShowStats, onShowSettings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleItemClick = (item) => {
    if (item === 'Статистика') {
      if (onShowStats) onShowStats();
    } else if (item === 'Настройки') {
      if (onShowSettings) onShowSettings();
    }
    
    closeMenu();
  };

  return (
    <>
      <button
        className={`burger-btn ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div 
        className={`modal-overlay ${isMenuOpen ? 'active' : ''}`} 
        onClick={closeMenu}
      >
        <div 
          className={`modal-content ${isMenuOpen ? 'active' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Меню</h2>
          </div>

          <div className="menu-items">
            <button 
              className="menu-item"
              onClick={() => handleItemClick('Тренажер')}
            >
              <div className="item-icon icon-back"></div>
              <div className="item-text">Вернуться к тренажеру</div>
            </button>

            <button 
              className="menu-item"
              onClick={() => handleItemClick('Статистика')}
            >
              <div className="item-icon icon-stats"></div>
              <div className="item-text">Статистика</div>
            </button>

            <button 
              className="menu-item"
              onClick={() => handleItemClick('Настройки')}
            >
              <div className="item-icon icon-settings"></div>
              <div className="item-text">Настройки</div>
            </button>
          </div>

          <div className="modal-footer">
            <p>Сайт выполнил: Чабдаров Артур</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BurgerMenu;
