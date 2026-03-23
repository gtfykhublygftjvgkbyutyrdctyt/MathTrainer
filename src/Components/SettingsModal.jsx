import React, { useState, useEffect } from 'react';
import styles from './SettingsModal.module.css';
import { HexColorPicker } from "react-colorful";

const SettingsModal = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState({
    goal: 5,
    interfaceColor: "#348de6",
    showSqrtButton: false, 
    operationsConfig: {
      basic: true,
      powers: false,
      log: false,
      sqrt: false,
      trig: { enabled: false, sin: false, cos: false, tg: false, ctg: false }
    }
  });

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const safeSettings = {
        goal: settings?.goal ?? 5,
        interfaceColor: settings?.interfaceColor ?? "#348de6",
        showSqrtButton: settings?.showSqrtButton ?? false, 
        operationsConfig: {
          basic: settings?.operationsConfig?.basic ?? true,
          powers: settings?.operationsConfig?.powers ?? false,
          log: settings?.operationsConfig?.log ?? false,
          sqrt: settings?.operationsConfig?.sqrt ?? false,
          trig: {
            enabled: settings?.operationsConfig?.trig?.enabled ?? false,
            sin: settings?.operationsConfig?.trig?.sin ?? false,
            cos: settings?.operationsConfig?.trig?.cos ?? false,
            tg: settings?.operationsConfig?.trig?.tg ?? false,
            ctg: settings?.operationsConfig?.trig?.ctg ?? false
          }
        }
      };
      setLocalSettings(safeSettings);
    }
  }, [isOpen, settings]);

  const deepCopy = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    const copy = Array.isArray(obj) ? [] : {};
    for (let key in obj) {
      copy[key] = deepCopy(obj[key]);
    }
    return copy;
  };

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleOperationChange = (path, value) => {
    setLocalSettings(prev => {
      const newConfig = deepCopy(prev.operationsConfig || {});
      let current = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key]) current[key] = {};
        current = current[key];
      }
      current[path[path.length - 1]] = value;
      if (path[0] === 'trig' && path[1] === 'enabled' && !value) {
        newConfig.trig = { enabled: false, sin: false, cos: false, tg: false, ctg: false };
      }
      return { ...prev, operationsConfig: newConfig };
    });
  };

  const hasValidOperations = () => {
    const config = localSettings.operationsConfig;
    return (
      config?.basic === true ||
      config?.powers === true ||
      config?.log === true ||
      config?.sqrt === true ||
      (config?.trig?.enabled === true && (
        config.trig.sin === true ||
        config.trig.cos === true ||
        config.trig.tg === true ||
        config.trig.ctg === true
      ))
    );
  };

  const isLightColor = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  const applyInterfaceColor = (color) => {
    document.documentElement.style.setProperty('--interface-color', color);
    const iconColor = isLightColor(color) ? '#333333' : '#ffffff';
    document.documentElement.style.setProperty('--interface-icon-color', iconColor);
  };

  const saveSettings = () => {
    try {
      onSettingsChange(localSettings);
      localStorage.setItem('mathTrainerSettings', JSON.stringify(localSettings));
      applyInterfaceColor(localSettings.interfaceColor);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  };

  const resetSettings = () => {
    if (!window.confirm('Сбросить все настройки?')) return;

    const defaults = {
      goal: 5,
      interfaceColor: "#348de6",
      showSqrtButton: false,
      operationsConfig: {
        basic: true,
        powers: false,
        log: false,
        sqrt: false,
        trig: { enabled: false, sin: false, cos: false, tg: false, ctg: false }
      }
    };

    setLocalSettings(defaults);
    onSettingsChange(defaults);
    localStorage.setItem('mathTrainerSettings', JSON.stringify(defaults));
    applyInterfaceColor(defaults.interfaceColor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.settingsOverlay} onClick={onClose} />
      <div className={styles.settingsModal} onClick={e => e.stopPropagation()}>
        <div className={styles.settingsHeader}>
          <h2 className={styles.settingsTitle}>Настройки</h2>
          <button className={styles.settingsCloseBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.settingsContent}>
          <h3 className={styles.settingsSectionTitle}>Сложность</h3>
          <div className={styles.settingsItem}>
            <label className={styles.settingsLabel}>
              Правильно решенных задач <br /> для повышения уровня:
            </label>
            <select
              className={styles.settingsSelect}
              value={localSettings.goal}
              onChange={(e) => handleChange('goal', parseInt(e.target.value))}
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
              <option value={10}>10</option>
            </select>
          </div>

          <h3 className={styles.settingsSectionTitle}>Типы операций</h3>
          <div className={styles.operationsGrid}>
            <label className={styles.operationsMainLabel} htmlFor="basic-ops">
              <input
                id="basic-ops"
                type="checkbox"
                className={styles.operationsMainCheckbox}
                checked={!!localSettings.operationsConfig?.basic}
                onChange={(e) => handleOperationChange(['basic'], e.target.checked)}
                aria-label="Включить обычные операции (+, -, ×, ÷)"
              />
              Элементарные (+, -, ×, ÷)
            </label>
            <label className={styles.operationsMainLabel} htmlFor="powers-ops">
              <input
                id="powers-ops"
                type="checkbox"
                className={styles.operationsMainCheckbox}
                checked={!!localSettings.operationsConfig?.powers}
                onChange={(e) => handleOperationChange(['powers'], e.target.checked)}
                aria-label="Включить степени (n^x)"
              />
              Степени (n<sup>x</sup>)
            </label>
          </div>
          <div className={styles.operationsGrid}>
            <label className={styles.operationsMainLabel} htmlFor="log-ops">
              <input
                id="log-ops"
                type="checkbox"
                className={styles.operationsMainCheckbox}
                checked={!!localSettings.operationsConfig?.log}
                onChange={(e) => handleOperationChange(['log'], e.target.checked)}
                aria-label="Включить логарифмы (log_a(b))"
              />
              Логарифмы (log<sub>a</sub>(b))
            </label>
            <label className={styles.operationsMainLabel} htmlFor="sqrt-ops">
              <input
                id="sqrt-ops"
                type="checkbox"
                className={styles.operationsMainCheckbox}
                checked={!!localSettings.operationsConfig?.sqrt}
                onChange={(e) => handleOperationChange(['sqrt'], e.target.checked)}
                aria-label="Включить корни (√x)"
              />
              Корни (√x)
            </label>
          </div>

          <div className={styles.operationsGroup}>
            <label className={styles.operationsMainLabel} htmlFor="trig-enabled">
              <input
                id="trig-enabled"
                type="checkbox"
                className={styles.operationsMainCheckbox}
                checked={!!localSettings.operationsConfig?.trig?.enabled}
                onChange={(e) => handleOperationChange(['trig', 'enabled'], e.target.checked)}
                aria-label="Включить тригонометрию"
              />
              Тригонометрия
            </label>
            {localSettings.operationsConfig?.trig?.enabled && (
              <div className={styles.trigSubgrid}>
                <label htmlFor="trig-sin">
                  <input
                    id="trig-sin"
                    type="checkbox"
                    className={styles.operationsMainCheckbox}
                    checked={!!localSettings.operationsConfig.trig.sin}
                    onChange={(e) => handleOperationChange(['trig', 'sin'], e.target.checked)}
                    aria-label="Включить sin"
                  />
                  sin
                </label>
                <label htmlFor="trig-cos">
                  <input
                    id="trig-cos"
                    type="checkbox"
                    className={styles.operationsMainCheckbox}
                    checked={!!localSettings.operationsConfig.trig.cos}
                    onChange={(e) => handleOperationChange(['trig', 'cos'], e.target.checked)}
                    aria-label="Включить cos"
                  />
                  cos
                </label>
                <label htmlFor="trig-tg">
                  <input
                    id="trig-tg"
                    type="checkbox"
                    className={styles.operationsMainCheckbox}
                    checked={!!localSettings.operationsConfig.trig.tg}
                    onChange={(e) => handleOperationChange(['trig', 'tg'], e.target.checked)}
                    aria-label="Включить tg"
                  />
                  tg
                </label>
                <label htmlFor="trig-ctg">
                  <input
                    id="trig-ctg"
                    type="checkbox"
                    className={styles.operationsMainCheckbox}
                    checked={!!localSettings.operationsConfig.trig.ctg}
                    onChange={(e) => handleOperationChange(['trig', 'ctg'], e.target.checked)}
                    aria-label="Включить ctg"
                  />
                  ctg
                </label>
              </div>
            )}
          </div>

          <h3 className={styles.settingsSectionTitle}>Интерфейс</h3>
          
          <label htmlFor="sqrt-button-enabled" className={styles.sqrtButtonLabel}>
            <div className={styles.sqrtButtonContainer}>
              <input
                id="sqrt-button-enabled"
                type="checkbox"
                className={styles.sqrtButtonCheckbox}
                checked={!!localSettings.showSqrtButton}
                onChange={(e) => handleChange('showSqrtButton', e.target.checked)}
                aria-label="Показывать кнопку ввода корня"
              />
              Показывать кнопку ввода корня (√)
            </div>
          </label>

          <h3 className={styles.settingsSectionTitle}>Персонализация</h3>
          <div className={styles.colorPickerGroup}>
            <label className={styles.colorPickerLabel}>Цвет интерфейса</label>
            <div className={styles.colorPickerWrapper}>
              <HexColorPicker
                color={localSettings.interfaceColor}
                onChange={(color) => handleChange('interfaceColor', color)}
              />
            </div>
          </div>
        </div>

        <div className={styles.settingsActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetSettings}>
            Сбросить
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${!hasValidOperations() ? styles.btnDisabled : ''}`}
            onClick={saveSettings}
            disabled={!hasValidOperations()}
          >
            Сохранить
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;