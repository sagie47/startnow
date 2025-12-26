import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_VERSION = '1';
const VERSION_KEY = '@rocket_storage_version';
const BLOCKS_KEY = '@rocket_blocks';
const PROOFS_KEY = '@rocket_proofs';
const SETTINGS_KEY = '@rocket_settings';
const CONSTRAINTS_KEY = '@rocket_constraints';

export interface Block {
  id: string;
  title: string;
  type: 'Deep' | 'Admin' | 'Health' | 'Learning' | 'Social' | 'Errand' | 'Other';
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

export interface Constraints {
  sleepFloor: number;
  workHoursPerDay: number;
  workDaysPerWeek: number;
  commuteMinutesPerDay: number;
  weeklyGoalHours: number;
  monthlyBudget: number;
}

export interface UserSettings {
  timezone: string;
  weekStart: 'sunday' | 'monday';
  schemaVersion: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  weekStart: 'monday',
  schemaVersion: STORAGE_VERSION,
};

const DEFAULT_CONSTRAINTS: Constraints = {
  sleepFloor: 7,
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  commuteMinutesPerDay: 30,
  weeklyGoalHours: 10,
  monthlyBudget: 500,
};

async function migrateIfNeeded(): Promise<void> {
  const currentVersion = await AsyncStorage.getItem(VERSION_KEY);
  if (currentVersion === STORAGE_VERSION) {
    return;
  }

  if (!currentVersion) {
    await AsyncStorage.setItem(VERSION_KEY, STORAGE_VERSION);
  }
}

export async function loadBlocks(): Promise<Block[]> {
  try {
    const data = await AsyncStorage.getItem(BLOCKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load blocks:', error);
    return [];
  }
}

export async function saveBlocks(blocks: Block[]): Promise<void> {
  try {
    await AsyncStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  } catch (error) {
    console.error('Failed to save blocks:', error);
  }
}

export async function loadProofs(): Promise<Proof[]> {
  try {
    const data = await AsyncStorage.getItem(PROOFS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load proofs:', error);
    return [];
  }
}

export async function saveProofs(proofs: Proof[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PROOFS_KEY, JSON.stringify(proofs));
  } catch (error) {
    console.error('Failed to save proofs:', error);
  }
}

export async function loadConstraints(): Promise<Constraints> {
  try {
    const data = await AsyncStorage.getItem(CONSTRAINTS_KEY);
    return data ? JSON.parse(data) : DEFAULT_CONSTRAINTS;
  } catch (error) {
    console.error('Failed to load constraints:', error);
    return DEFAULT_CONSTRAINTS;
  }
}

export async function saveConstraints(constraints: Constraints): Promise<void> {
  try {
    await AsyncStorage.setItem(CONSTRAINTS_KEY, JSON.stringify(constraints));
  } catch (error) {
    console.error('Failed to save constraints:', error);
  }
}

export async function loadSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      const settings = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...settings, schemaVersion: STORAGE_VERSION };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    const currentSettings = await loadSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function calculateAvailableHours(constraints: Constraints): number {
  const HOURS_PER_WEEK = 168;
  const sleepHoursPerWeek = constraints.sleepFloor * 7;
  const workHoursPerWeek = constraints.workHoursPerDay * constraints.workDaysPerWeek;
  const commuteHoursPerWeek = (constraints.commuteMinutesPerDay * constraints.workDaysPerWeek) / 60;
  const lifeAdminBufferHoursPerWeek = 10;

  const availableHours = HOURS_PER_WEEK 
    - sleepHoursPerWeek 
    - workHoursPerWeek 
    - commuteHoursPerWeek 
    - lifeAdminBufferHoursPerWeek;

  return Math.max(0, availableHours);
}

export type FeasibilityStatus = 'green' | 'yellow' | 'red';

export interface FeasibilityResult {
  status: FeasibilityStatus;
  availableHours: number;
  message: string;
}

export function calculateFeasibility(
  planHours: number,
  constraints: Constraints
): FeasibilityResult {
  const availableHours = calculateAvailableHours(constraints);
  const greenThreshold = availableHours * 0.8;

  if (planHours <= greenThreshold) {
    return {
      status: 'green',
      availableHours,
      message: 'Plan fits comfortably within your time budget.',
    };
  }
  
  if (planHours <= availableHours) {
    return {
      status: 'yellow',
      availableHours,
      message: 'Tight execution required. Consider reducing scope.',
    };
  }
  
    return {
      status: 'red',
      availableHours,
      message: 'Plan exceeds available time. Must reduce scope or extend timeline.',
    };
}

export interface PlanVariant {
  level: 'mvg' | 'standard' | 'aggressive';
  hours: number;
  description: string;
  feasibility: FeasibilityStatus;
}

export function generatePlanVariants(goal: string, constraints: Constraints): PlanVariant[] {
  const availableHours = calculateAvailableHours(constraints);
  
  return [
    {
      level: 'mvg',
      hours: Math.round(availableHours * 0.3),
      description: 'Core fundamentals only',
      feasibility: 'green',
    },
    {
      level: 'standard',
      hours: Math.round(availableHours * 0.6),
      description: 'Balanced approach with key features',
      feasibility: 'green',
    },
    {
      level: 'aggressive',
      hours: Math.min(24, Math.round(availableHours * 0.9)),
      description: 'Full scope, tight execution',
      feasibility: availableHours < 20 ? 'yellow' : 'green',
    }
  ];
}

export interface AIErrorResponse {
  error: string;
  details?: string;
}

export interface BlockTemplate {
  id: string;
  title: string;
  type: 'Deep' | 'Admin' | 'Health' | 'Learning' | 'Social' | 'Errand' | 'Other';
  minutes: number;
  fallbackMinutes?: number;
  priority: number;
  protected: boolean;
  notes: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'high' | 'medium' | 'low';
}

export interface GoalOptimizerRequest {
  goalText: string;
  constraints: Constraints;
  preferences?: {
    weekStart: 'sunday' | 'monday';
    timezone: string;
  };
}

export interface GoalOptimizerResponse {
  tone: 'strict' | 'neutral';
  deliverables: Deliverable[];
  recommendedWeeklyHours: number;
  blocks: BlockTemplate[];
  variants: PlanVariant[];
  suggestions: string[];
  warnings: string[];
}

export interface BlockAssistRequest {
  partialTitle?: string;
  partialDescription?: string;
  constraints: Constraints;
  currentBlocks: BlockTemplate[];
  preferences?: {
    weekStart: 'sunday' | 'monday';
    timezone: string;
  };
}

export interface BlockAssistResponse {
  block: BlockTemplate;
  reasoning: string[];
}

export interface DebriefRequest {
  plannedBlocks: number;
  completedBlocks: number;
  skippedBlocks: number;
  shrunkBlocks: number;
  driftMinutes: number;
  dayStart?: string;
  dayEnd?: string;
}

export interface DebriefResponse {
  tomorrowRule: string;
  oneChange: string;
  keepDoing: string;
  encouragement: string;
}

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      BLOCKS_KEY,
      PROOFS_KEY,
      SETTINGS_KEY,
      CONSTRAINTS_KEY,
    ]);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}
