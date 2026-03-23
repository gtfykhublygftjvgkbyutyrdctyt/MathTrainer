import React, { useState, useEffect } from 'react';
import styles from './BurgerMenu.module.css';

const BurgerMenu = ({ onShowStats, onShowSettings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const handleItemClick = (item) => {
    switch (item) {
      case 'Статистика':
        if (onShowStats) onShowStats();
        break;
      case 'Настройки':
        if (onShowSettings) onShowSettings();
        break;
      case 'Тренажер':
        break;
      default:
        break;
    }
    closeMenu();
  };

  return (
    <>
      <button
        className={`${styles.burgerBtn} ${isMenuOpen ? styles.active : ''}`}
        onClick={toggleMenu}
        aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
        type="button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isMenuOpen && (
        <div 
          className={styles.modalOverlay}
          onClick={closeMenu}
        >
          <div 
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Меню</h2>
            </div>

            <div className={styles.menuItems}>
              <button 
                className={styles.menuItem}
                onClick={() => handleItemClick('Тренажер')}
                type="button"
              >
                <div className={`${styles.itemIcon} ${styles.iconBack}`}></div>
                <div className={styles.itemText}>Вернуться к тренажеру</div>
              </button>

              <button 
                className={styles.menuItem}
                onClick={() => handleItemClick('Статистика')}
                type="button"
              >
                <div className={`${styles.itemIcon} ${styles.iconStats}`}></div>
                <div className={styles.itemText}>Статистика</div>
              </button>

              <button 
                className={styles.menuItem}
                onClick={() => handleItemClick('Настройки')}
                type="button"
              >
                <div className={`${styles.itemIcon} ${styles.iconSettings}`}></div>
                <div className={styles.itemText}>Настройки</div>
              </button>
            </div>

            <div className={styles.modalFooter}>
              <p>Сайт выполнил: Чабдаров Артур</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BurgerMenu;