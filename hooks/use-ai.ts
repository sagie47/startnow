import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_ENABLED_KEY = '@rocket_ai_enabled';

export function useAI() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadAISetting = async () => {
    try {
      setIsLoading(true);
      const enabled = await AsyncStorage.getItem(AI_ENABLED_KEY);
      setIsEnabled(enabled === 'true');
    } catch (error) {
      console.error('Failed to load AI setting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAI = async () => {
    try {
      const newValue = !isEnabled;
      await AsyncStorage.setItem(AI_ENABLED_KEY, newValue ? 'true' : 'false');
      setIsEnabled(newValue);
    } catch (error) {
      console.error('Failed to toggle AI:', error);
    }
  };

  return {
    isEnabled,
    isLoading,
    loadAISetting,
    toggleAI,
  };
}
