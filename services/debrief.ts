import { callGemini, parseGeminiJSON } from './gemini';
import type { DebriefResponse } from '../types/ai-service';

export async function generateDebrief(
  plannedBlocks: number,
  completedBlocks: number,
  skippedBlocks: number,
  shrunkBlocks: number,
  driftMinutes: number,
  dayStart?: string,
  dayEnd?: string
): Promise<DebriefResponse> {
  const prompt = `You are a debrief assistant that reviews daily execution and sets tomorrow's rule.

CONSTRAINTS-FIRST APPROACH:
- You never flatter or hype
- You focus on what the data says
- You acknowledge constraints and reality
- Tomorrow's rule is concrete, actionable, and realistic

DAY'S DATA:
- Planned blocks: ${plannedBlocks}
- Completed blocks: ${completedBlocks}
- Skipped blocks: ${skippedBlocks}
- Shrunk blocks: ${shrunkBlocks}
- Drift (minutes behind schedule): ${driftMinutes}
- Day start: ${dayStart || '(not set)'}
- Day end: ${dayEnd || '(not set)'}

CALCULATE:
- Completion rate: ${plannedBlocks > 0 ? Math.round((completedBlocks / plannedBlocks) * 100) : 0}%
- Adherence: ${driftMinutes < 10 ? 'on track' : driftMinutes < 30 ? 'slipping' : 'off track'}

RESPONSE FORMAT (JSON):
\`\`\`json
{
  "streakStatus": "maintained" | "broken",
  "blocksCompleted": ${completedBlocks},
  "blocksPlanned": ${plannedBlocks},
  "completionPercent": ${plannedBlocks > 0 ? Math.round((completedBlocks / plannedBlocks) * 100) : 0},
  "tomorrowRule": "one concrete rule for tomorrow, 5-10 words, no fluff",
  "insights": [
    "observation 1",
    "observation 2"
  ],
  "recommendations": [
    {"title": "short title", "action": "specific action", "priority": "high" | "medium" | "low"}
  ]
}
\`\`\`

RULES:
1. Analyze objectively: what worked, what didn't, why
2. Tomorrow's rule must be actionable (e.g., "start with Deep work" not "try harder")
3. If drift > 30 min or completion < 50%, streak is broken
4. Focus on constraints: time, energy, realistic expectations
5. No "good job" or "you can do it" fluff
6. Recommendations must address root causes (e.g., overplanning, poor estimation)
7. Always respond in valid JSON`;

  const response = await callGemini(prompt);
  return parseGeminiJSON<DebriefResponse>(response);
}
