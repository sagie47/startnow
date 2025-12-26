import { useState, useEffect, useCallback } from 'react';
import { loadSettings, saveSettings, type UserSettings } from '@/utils/storage';

const DEFAULT_SETTINGS: UserSettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  weekStart: 'monday',
  schemaVersion: '1',
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    const loadedSettings = await loadSettings();
    setSettings(loadedSettings);
    setLoading(false);
  };

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      saveSettings(updates);
      return newSettings;
    });
  }, []);

  return {
    settings,
    loading,
    updateSettings,
  };
}
