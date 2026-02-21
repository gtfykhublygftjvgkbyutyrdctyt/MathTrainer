import React, { useState, useEffect } from 'react';
import './SettingsModal.css';
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
    operationsConfig: {
      basic: true,
      powers: false,
      log: false,
      sqrt: false,
      trig: { enabled: false, sin: false, cos: false, tan: false, cot: false }
    }
  });

  useEffect(() => {
    if (isOpen) {
      const safeSettings = {
        goal: settings?.goal ?? 5,
        interfaceColor: settings?.interfaceColor ?? "#348de6",
        operationsConfig: {
          basic: settings?.operationsConfig?.basic ?? true,
          powers: settings?.operationsConfig?.powers ?? false,
          log: settings?.operationsConfig?.log ?? false,
          sqrt: settings?.operationsConfig?.sqrt ?? false,
          trig: {
            enabled: settings?.operationsConfig?.trig?.enabled ?? false,
            sin: settings?.operationsConfig?.trig?.sin ?? false,
            cos: settings?.operationsConfig?.trig?.cos ?? false,
            tan: settings?.operationsConfig?.trig?.tan ?? false,
            cot: settings?.operationsConfig?.trig?.cot ?? false
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
        newConfig.trig = { enabled: false, sin: false, cos: false, tan: false, cot: false };
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
        config.trig.tan === true ||
        config.trig.cot === true
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
      operationsConfig: {
        basic: true,
        powers: false,
        log: false,
        sqrt: false,
        trig: { enabled: false, sin: false, cos: false, tan: false, cot: false }
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
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">Настройки</h2>
          <button className="settings-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <h3 className="settings-section-title">Сложность</h3>
          <div className="settings-item">
            <label className="settings-label">
              Правильно решенных задач <br /> для повышения уровня:
            </label>
            <select
              className="settings-select"
              value={localSettings.goal}
              onChange={(e) => handleChange('goal', parseInt(e.target.value))}
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
              <option value={10}>10</option>
            </select>
          </div>

          <h3 className="settings-section-title">Типы операций</h3>
          <div className="operations-grid">
            <label className="operations-main-label" htmlFor="basic-ops">
              <input
                id="basic-ops"
                type="checkbox"
                className="operations-main-checkbox"
                checked={!!localSettings.operationsConfig?.basic}
                onChange={(e) => handleOperationChange(['basic'], e.target.checked)}
                aria-label="Включить обычные операции (+, -, ×, ÷)"
              />
              Элементарные (+, -, ×, ÷)
            </label>
            <label className="operations-main-label" htmlFor="powers-ops">
              <input
                id="powers-ops"
                type="checkbox"
                className="operations-main-checkbox"
                checked={!!localSettings.operationsConfig?.powers}
                onChange={(e) => handleOperationChange(['powers'], e.target.checked)}
                aria-label="Включить степени (n^x)"
              />
              Степени (n<sup>x</sup>)
            </label>
          </div>
          <div className="operations-grid">
            <label className="operations-main-label" htmlFor="log-ops">
              <input
                id="log-ops"
                type="checkbox"
                className="operations-main-checkbox"
                checked={!!localSettings.operationsConfig?.log}
                onChange={(e) => handleOperationChange(['log'], e.target.checked)}
                aria-label="Включить логарифмы (log_a(b))"
              />
              Логарифмы (log<sub>a</sub>(b))
            </label>
            <label className="operations-main-label" htmlFor="sqrt-ops">
              <input
                id="sqrt-ops"
                type="checkbox"
                className="operations-main-checkbox"
                checked={!!localSettings.operationsConfig?.sqrt}
                onChange={(e) => handleOperationChange(['sqrt'], e.target.checked)}
                aria-label="Включить корни (√x)"
              />
              Корни (&radic;x)
            </label>
          </div>

          <div className="operations-group">
            <label className="operations-main-label" htmlFor="trig-enabled">
              <input
                id="trig-enabled"
                type="checkbox"
                className="operations-main-checkbox"
                checked={!!localSettings.operationsConfig?.trig?.enabled}
                onChange={(e) => handleOperationChange(['trig', 'enabled'], e.target.checked)}
                aria-label="Включить тригонометрию"
              />
              Тригонометрия
            </label>
            {localSettings.operationsConfig?.trig?.enabled && (
              <div className="trig-subgrid">
                <label htmlFor="trig-sin">
                  <input
                    id="trig-sin"
                    type="checkbox"
                    className="operations-main-checkbox"
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
                    className="operations-main-checkbox"
                    checked={!!localSettings.operationsConfig.trig.cos}
                    onChange={(e) => handleOperationChange(['trig', 'cos'], e.target.checked)}
                    aria-label="Включить cos"
                  />
                  cos
                </label>
                <label htmlFor="trig-tan">
                  <input
                    id="trig-tan"
                    type="checkbox"
                    className="operations-main-checkbox"
                    checked={!!localSettings.operationsConfig.trig.tan}
                    onChange={(e) => handleOperationChange(['trig', 'tan'], e.target.checked)}
                    aria-label="Включить tan"
                  />
                  tan
                </label>
                <label htmlFor="trig-cot">
                  <input
                    id="trig-cot"
                    type="checkbox"
                    className="operations-main-checkbox"
                    checked={!!localSettings.operationsConfig.trig.cot}
                    onChange={(e) => handleOperationChange(['trig', 'cot'], e.target.checked)}
                    aria-label="Включить cot"
                  />
                  cot
                </label>
              </div>
            )}
          </div>

          <h3 className="settings-section-title">Персонализация</h3>
          <div className="color-picker-group">
            <label className="color-picker-label">Цвет интерфейса</label>
            <div className="color-picker-wrapper">
              <HexColorPicker
                color={localSettings.interfaceColor}
                onChange={(color) => handleChange('interfaceColor', color)}
              />
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={resetSettings}>
            Сбросить
          </button>
          <button
            className={`btn btn-primary ${!hasValidOperations() ? 'btn-disabled' : ''}`}
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