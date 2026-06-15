import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'app_settings';

const DEFAULT_SETTINGS = {
  autosave: false,
  autosaveInterval: 60,
  snapToGrid: false,
  showGuides: false,
  showRulers: false,
  exportFormat: 'pdf',
  exportQuality: 'high',
  embedFonts: true,
  uiScale: 100,
};

const AppSettingsContext = createContext(null);

const loadSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
};

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.dataset.uiScale = String(settings.uiScale);
    document.documentElement.style.fontSize = `${(settings.uiScale / 100) * 16}px`;
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};
