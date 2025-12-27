export interface Constraint {
  sleepFloor: number;
  workHoursPerDay: number;
  workDaysPerWeek: number;
  commuteMinutesPerDay: number;
  weeklyGoalHours: number;
  monthlyBudget: number;
}

export interface Block {
  id: string;
  title: string;
  type: 'Deep' | 'Admin' | 'Health' | 'Learning';
  startTime: string;
  duration: number;
  fixed: boolean;
  completed: boolean;
  priority: 1 | 2 | 3;
  fallbackMinutes?: number;
  protected?: boolean;
}

export interface Proof {
  id: string;
  blockId: string;
  link?: string;
  note?: string;
  timestamp: number;
}

export interface PlanVariant {
  hours: number;
  description: string;
  blocks?: Block[];
  feasibility?: 'green' | 'yellow' | 'red';
  feasibilityMessage?: string;
}

export interface FeasibilityResult {
  status: 'green' | 'yellow' | 'red';
  message: string;
  utilizationPercent: number;
}
