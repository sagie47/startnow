import { useState, useEffect, useCallback } from 'react';
import { loadConstraints, saveConstraints, type Constraints } from '@/utils/storage';

export function useConstraints() {
  const [constraints, setConstraints] = useState<Constraints>({
    sleepFloor: 7,
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    commuteMinutesPerDay: 30,
    weeklyGoalHours: 10,
    monthlyBudget: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConstraintsData();
  }, []);

  const loadConstraintsData = async () => {
    const loadedConstraints = await loadConstraints();
    setConstraints(loadedConstraints);
    setLoading(false);
  };

  const updateConstraints = useCallback((updates: Partial<Constraints>) => {
    setConstraints((prev) => {
      const newConstraints = { ...prev, ...updates };
      saveConstraints(newConstraints);
      return newConstraints;
    });
  }, []);

  return {
    constraints,
    loading,
    updateConstraints,
  };
}
