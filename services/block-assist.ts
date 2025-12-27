import { callGemini, parseGeminiJSON } from './gemini';
import type { BlockAssistResponse } from '../types/ai-service';

type BlockType = 'Deep' | 'Admin' | 'Health' | 'Learning' | 'Social' | 'Errand' | 'Other';

export async function assistBlock(
  partialTitle?: string,
  partialDescription?: string,
  constraints: {
    sleepFloor: number;
    workHoursPerDay: number;
    workDaysPerWeek: number;
    commuteMinutesPerDay: number;
    weeklyGoalHours: number;
    monthlyBudget: number;
  } = {
    sleepFloor: 7,
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    commuteMinutesPerDay: 30,
    weeklyGoalHours: 10,
    monthlyBudget: 500,
  },
  currentBlocks: Array<{
    title: string;
    type: BlockType;
    durationMinutes: number;
  }> = []
): Promise<BlockAssistResponse> {
  const prompt = `You are a planning assistant that suggests concrete time blocks based on partial inputs.
  
CONSTRAINTS:
- Sleep floor: ${constraints.sleepFloor}h/night
- Work: ${constraints.workHoursPerDay}h/day, ${constraints.workDaysPerWeek} days/week
- Commute: ${constraints.commuteMinutesPerDay}min/day
- Available goal hours/week: ${constraints.weeklyGoalHours}h
- Monthly budget: $${constraints.monthlyBudget}
  
EXISTING BLOCKS:
${currentBlocks.map((b, i) => `${i + 1}. ${b.title} (${b.type}, ${b.durationMinutes}min)`).join('\n')}
  
PARTIAL INPUT:
- Title: ${partialTitle || '(empty)'}
- Description: ${partialDescription || '(empty)'}
  
BLOCK TYPES:
- Deep: High-focus work (programming, writing, design)
- Admin: Email, calls, paperwork, meetings
- Health: Exercise, meditation, meal prep
- Learning: Reading, tutorials, research, practice
- Social: Networking, social events, family time
- Errand: Tasks outside home (groceries, shopping, errands)
- Other: General activities not fitting other categories
  
RESPONSE FORMAT (JSON):
\`\`\`json
{
  "suggestions": [
    {
      "title": "concrete action title",
      "durationMinutes": 60,
      "type": "Deep",
      "priority":1,
      "notes": "why this is the right next step"
    }
  ]
}
\`\`\`

RULES:
1. Generate 1-3 suggestions
2. If no partial input, suggest general high-value activities
3. Prioritize based on existing blocks (fill gaps, don't duplicate)
4. Round durations to 15-minute intervals (15, 30, 45, 60, 90, 120)
5. Priority 1 for core work, 2 for support tasks, 3 for nice-to-haves
6. Always respond in valid JSON`;

  const response = await callGemini(prompt);
  return parseGeminiJSON<BlockAssistResponse>(response);
}
