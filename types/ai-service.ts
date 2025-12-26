export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OptimizedGoalResponse {
  goal: string;
  deliverables: string[];
  variants: {
    mvg: {
      hours: number;
      description: string;
      blocks: {
        title: string;
        type: 'Deep' | 'Admin' | 'Health' | 'Learning';
        durationMinutes: number;
        priority: 1 | 2 | 3;
        fixed: boolean;
      }[];
    };
    standard: {
      hours: number;
      description: string;
      blocks: {
        title: string;
        type: 'Deep' | 'Admin' | 'Health' | 'Learning';
        durationMinutes: number;
        priority: 1 | 2 | 3;
        fixed: boolean;
      }[];
    };
    aggressive: {
      hours: number;
      description: string;
      blocks: {
        title: string;
        type: 'Deep' | 'Admin' | 'Health' | 'Learning';
        durationMinutes: number;
        priority: 1 | 2 | 3;
        fixed: boolean;
      }[];
    };
  };
}

export interface BlockAssistResponse {
  suggestions: {
    title: string;
    durationMinutes: number;
    type: 'Deep' | 'Admin' | 'Health' | 'Learning';
    priority: 1 | 2 | 3;
    notes: string;
  }[];
}

export interface DebriefResponse {
  streakStatus: 'maintained' | 'broken';
  blocksCompleted: number;
  blocksPlanned: number;
  completionPercent: number;
  tomorrowRule: string;
  insights: string[];
  recommendations: {
    title: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}
