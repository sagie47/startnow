import { callGemini, parseGeminiJSON } from './gemini';
import type { OptimizedGoalResponse } from '../types/ai-service';

export async function optimizeGoal(
  goal: string,
  constraints: {
    sleepFloor: number;
    workHoursPerDay: number;
    workDaysPerWeek: number;
    commuteMinutesPerDay: number;
    weeklyGoalHours: number;
    monthlyBudget: number;
    availableHours?: number;
  }
): Promise<OptimizedGoalResponse> {
  const prompt = `You are a rigorous planning assistant that turns vague goals into realistic plans based on hard constraints.

Your job: Analyze the user's goal and generate 3 plan variants (MVG, Standard, Aggressive) with specific time blocks.

CONSTRAINTS:
- Sleep floor: ${constraints.sleepFloor}h/night
- Work: ${constraints.workHoursPerDay}h/day, ${constraints.workDaysPerWeek} days/week
- Commute: ${constraints.commuteMinutesPerDay}min/day
- Available goal hours/week: ${constraints.weeklyGoalHours}h
- Monthly budget: $${constraints.monthlyBudget}

Calculate available hours formula: 168 - (sleepFloor * 7) - (workHoursPerDay * workDaysPerWeek) - (commuteMinutesPerDay * workDaysPerWeek / 60) - 10h buffer

BLOCK TYPES:
- Deep: High-focus work (programming, writing, design)
- Admin: Email, calls, paperwork, meetings
- Health: Exercise, meditation, meal prep
- Learning: Reading, tutorials, research, practice

PRIORITY LEVELS:
- 1 (highest): Must happen, core to the goal
- 2 (medium): Important but flexible
- 3 (lowest): Nice to have, first to skip

FIXED vs FLEXIBLE:
- Fixed blocks: Non-negotiable (work, sleep, important meetings)
- Flexible blocks: Can move/shrink/skip

USER GOAL:
${goal}

RESPONSE FORMAT (JSON):
\`\`\`json
{
  "goal": "goal summary in your words",
  "deliverables": [
    {"id": "1", "title": "specific outcome", "description": "what success looks like", "estimatedHours": 10}
  ],
  "variants": {
    "mvg": {
      "hours": 6,
      "description": "core fundamentals only, 30% intensity",
      "blocks": [
        {"title": "block title", "type": "Deep", "durationMinutes": 60, "priority": 1, "fixed": false}
      ]
    },
    "standard": {
      "hours": 12,
      "description": "balanced approach, 60% intensity",
      "blocks": [
        {"title": "block title", "type": "Deep", "durationMinutes": 60, "priority": 1, "fixed": false}
      ]
    },
    "aggressive": {
      "hours": 18,
      "description": "full scope, 90% intensity, tight execution",
      "blocks": [
        {"title": "block title", "type": "Deep", "durationMinutes": 60, "priority": 1, "fixed": false}
      ]
    }
  }
}
\`\`\`

RULES:
1. MVG = 30% of available hours, Standard = 60%, Aggressive = 90% (max 24h)
2. Prioritize Deep work blocks
3. Round block durations to 15-minute intervals
4. Block titles should be concrete and actionable
5. Never exceed ${constraints.weeklyGoalHours}h per variant
6. Always respond in valid JSON with no markdown outside code blocks`;

  const response = await callGemini(prompt);
  return parseGeminiJSON<OptimizedGoalResponse>(response);
}
