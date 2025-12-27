import { callGemini, parseGeminiJSON } from './gemini';
import type { DebriefResponse } from '../types/ai-service';
import type { Debrief } from '../utils/storage';

export type GenerateDebriefInput = {
  plannedBlocks: number;
  completedBlocks: number;
  skippedBlocks: number;
  shrunkBlocks: number;
  driftMinutes: number;
  plannedMinutes: number;
  doneMinutes: number;
  dayStart?: string;
  dayEnd?: string;
};

export function buildGenerateDebriefInput(args: {
  plannedCount: number;
  doneCount: number;
  plannedMinutes: number;
  doneMinutes: number;
  skippedCount: number;
  shrunkCount: number;
  driftMinutes: number;
  dayStart?: string;
  dayEnd?: string;
}): GenerateDebriefInput {
  return {
    plannedBlocks: args.plannedCount,
    completedBlocks: args.doneCount,
    skippedBlocks: args.skippedCount,
    shrunkBlocks: args.shrunkCount,
    driftMinutes: args.driftMinutes,
    plannedMinutes: args.plannedMinutes,
    doneMinutes: args.doneMinutes,
    dayStart: args.dayStart,
    dayEnd: args.dayEnd,
  };
}

export const generateDebrief = (function() {
  return async function(input: GenerateDebriefInput): Promise<DebriefResponse> {
    const prompt = `You are a debrief assistant that reviews daily execution and sets tomorrow's rule.
  
CONSTRAINTS-FIRST APPROACH:
- You never flatter or hype
- You focus on what the data says
- You acknowledge constraints and reality
- Tomorrow's rule is concrete, actionable, and realistic
  
DAY'S DATA:
- Planned blocks: ${input.plannedBlocks}
- Completed blocks: ${input.completedBlocks}
- Skipped blocks: ${input.skippedBlocks}
- Shrunk blocks: ${input.shrunkBlocks}
- Drift (minutes behind schedule): ${input.driftMinutes}
- Day start: ${input.dayStart || '(not set)'}
- Day end: ${input.dayEnd || '(not set)'}
  
CALCULATE:
- Completion rate: ${input.plannedBlocks > 0 ? Math.round((input.completedBlocks / input.plannedBlocks) * 100) : 0}%
- Adherence: ${input.driftMinutes < 10 ? 'on track' : input.driftMinutes < 30 ? 'slipping' : 'off track'}
  
RESPONSE FORMAT (JSON):
\`\`\`json
{
  "streakStatus": "maintained" | "broken",
  "blocksCompleted": ${input.completedBlocks},
  "blocksPlanned": ${input.plannedBlocks},
  "completionPercent": ${input.plannedBlocks > 0 ? Math.round((input.completedBlocks / input.plannedBlocks) * 100) : 0},
  "tomorrowRule": "one concrete rule for tomorrow, 5-10 words, no fluff",
  "oneChange": "single actionable adjustment for tomorrow (6-120 chars)",
  "keepDoing": "single thing that worked today to repeat (6-120 chars)",
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
7. oneChange: single adjustment like "shrink first admin by 10 min" or "add 15 min buffer"
8. keepDoing: single win like "started with Deep work" or "used time blocking"
9. Always respond in valid JSON`;

    const response = await callGemini(prompt);
    return parseGeminiJSON<DebriefResponse>(response);
  };
}());

export const validateDebriefResponse = (function() {
  return function(response: Partial<DebriefResponse>): DebriefResponse {
    const validated: DebriefResponse = {
      streakStatus: response.streakStatus || 'maintained',
      blocksCompleted: response.blocksCompleted || 0,
      blocksPlanned: response.blocksPlanned || 0,
      completionPercent: Math.max(0, Math.min(100, response.completionPercent || 0)),
      tomorrowRule: response.tomorrowRule || '',
      oneChange: response.oneChange || '',
      keepDoing: response.keepDoing || '',
      insights: Array.isArray(response.insights) ? response.insights.slice(0, 5) : [],
      recommendations: Array.isArray(response.recommendations) ? response.recommendations.slice(0, 3) : [],
    };

    if (!validated.tomorrowRule || validated.tomorrowRule.length < 8 || validated.tomorrowRule.length > 140) {
      if (validated.completionPercent < 50) {
        validated.tomorrowRule = "Protect one block and finish it before adding anything else.";
      } else {
        validated.tomorrowRule = "Repeat today's first win earlier tomorrow.";
      }
    }

    if (!validated.oneChange || validated.oneChange.length < 6 || validated.oneChange.length > 120) {
      validated.oneChange = "Shrink the first Admin block by 10 minutes.";
    }

    if (!validated.keepDoing || validated.keepDoing.length < 6 || validated.keepDoing.length > 120) {
      validated.keepDoing = "Keep starting with a Deep block.";
    }

    validated.recommendations = validated.recommendations.map(rec => ({
      ...rec,
      priority: rec.priority === 'high' || rec.priority === 'medium' || rec.priority === 'low' ? rec.priority : 'medium',
    }));

    return validated;
  };
}());

export const analyzeDay = (function() {
  return async function(args: {
    date: string;
    plannedCount: number;
    doneCount: number;
    plannedMinutes: number;
    doneMinutes: number;
    skippedCount: number;
    shrunkCount: number;
    driftMinutes: number;
    dayStart?: string;
    dayEnd?: string;
  }): Promise<DebriefResponse> {
    const prompt = `You are an AI coach analyzing today's execution.
  
DAY'S DATA:
- Date: ${args.date}
- Planned blocks: ${args.plannedCount}
- Completed blocks: ${args.doneCount}
- Planned minutes: ${args.plannedMinutes}
- Completed minutes: ${args.doneMinutes}
- Skipped blocks: ${args.skippedCount}
- Shrunk blocks: ${args.shrunkCount}
- Drift (minutes behind): ${args.driftMinutes}
- Day start: ${args.dayStart || '(not set)'}
- Day end: ${args.dayEnd || '(not set)'}
  
CALCULATE:
- Completion rate: ${args.plannedMinutes > 0 ? Math.round((args.doneMinutes / args.plannedMinutes) * 100) : 0}%
- Adherence: ${args.driftMinutes < 10 ? 'on track' : args.driftMinutes < 30 ? 'slipping' : 'off track'}
  
RESPONSE FORMAT (JSON):
\`\`\`json
{
  "oneChange": "single actionable adjustment for tomorrow (6-120 chars)",
  "keepDoing": "single thing that worked today to repeat (6-120 chars)"
}
\`\`\`

RULES:
1. Analyze objectively: what worked, what didn't, why
2. Focus on constraints: time, energy, realistic expectations
3. One actionable change for tomorrow
4. One thing to keep doing
5. No fluff: direct, specific, actionable
6. Always respond in valid JSON`;

    const response = await callGemini(prompt);
    return parseGeminiJSON<DebriefResponse>(response);
  };
}());

export const planTomorrow = (function() {
  return async function(args: {
    date: string;
    plannedCount: number;
    doneCount: number;
    plannedMinutes: number;
    doneMinutes: number;
    skippedCount: number;
    shrunkCount: number;
    driftMinutes: number;
    dayStart?: string;
    dayEnd?: string;
  }): Promise<DebriefResponse> {
    const prompt = `You are an AI coach planning tomorrow based on today's execution.
  
DAY'S DATA:
- Date: ${args.date}
- Planned blocks: ${args.plannedCount}
- Completed blocks: ${args.doneCount}
- Planned minutes: ${args.plannedMinutes}
- Completed minutes: ${args.doneMinutes}
- Skipped blocks: ${args.skippedCount}
- Shrunk blocks: ${args.shrunkCount}
- Drift (minutes behind): ${args.driftMinutes}
- Day start: ${args.dayStart || '(not set)'}
- Day end: ${args.dayEnd || '(not set)'}
  
CALCULATE:
- Completion rate: ${args.plannedMinutes > 0 ? Math.round((args.doneMinutes / args.plannedMinutes) * 100) : 0}%
- Adherence: ${args.driftMinutes < 10 ? 'on track' : args.driftMinutes < 30 ? 'slipping' : 'off track'}
  
RESPONSE FORMAT (JSON):
\`\`\`json
{
  "tomorrowRule": "one concrete rule for tomorrow, 5-10 words, no fluff"
}
\`\`\`

RULES:
1. Analyze today's data: what worked, what didn't
2. Set one concrete rule for tomorrow (5-10 words, no fluff)
3. Rule should be actionable (e.g., "start with Deep work" not "try harder")
4. Focus on constraints and reality
5. No fluff: direct, specific, actionable
6. Always respond in valid JSON`;

    const response = await callGemini(prompt);
    return parseGeminiJSON<DebriefResponse>(response);
  };
}());

export const coachReply = (function() {
  return async function(args: {
    input: string;
    date: string;
  }): Promise<DebriefResponse> {
    const prompt = `You are an AI coach answering a user question.
  
USER INPUT:
"${args.input}"

CONTEXT:
- Today's date: ${args.date}
- Review previous debriefs for context if available

RESPONSE FORMAT (JSON):
\`\`\`json
{
  "tomorrowRule": "relevant advice based on the question (8-140 chars)"
}
\`\`\`

RULES:
1. Answer the user's question directly and specifically
2. Provide actionable advice related to planning, execution, or constraints
3. No fluff: get to the point
4. If the question is about technical issues, provide specific solutions
5. If the question is about motivation, be supportive but realistic
6. Always respond in valid JSON`;

    const response = await callGemini(prompt);
    return parseGeminiJSON<DebriefResponse>(response);
  };
}());

export function mapDebriefToStorage(args: {
  date: string;
  createdAt: number;
  inputs: Debrief["inputs"];
  ai: DebriefResponse;
}): Debrief {
  const completionPercent = Math.round(
    (args.inputs.doneMinutes / Math.max(1, args.inputs.plannedMinutes)) * 100
  );

  return {
    date: args.date,
    createdAt: args.createdAt,
    inputs: args.inputs,
    outputs: {
      tomorrowRule: args.ai.tomorrowRule,
      oneChange: args.ai.oneChange,
      keepDoing: args.ai.keepDoing,
      insights: args.ai.insights ?? [],
      recommendations: args.ai.recommendations ?? [],
      completionPercent,
      streakStatus: args.ai.streakStatus,
      blocksPlanned: args.ai.blocksPlanned ?? args.inputs.plannedCount,
      blocksCompleted: args.ai.blocksCompleted ?? args.inputs.doneCount,
    },
  };
}
