export async function callGemini(prompt: string): Promise<string> {
  const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  if (!API_KEY) {
    throw new Error('Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file');
  }

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        responseMimeTypes: ['application/json'],
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const candidates = data.candidates || [];
  const firstCandidate = candidates[0];

  if (!firstCandidate || !firstCandidate.content || !firstCandidate.content.parts || !firstCandidate.content.parts[0]) {
    throw new Error('Invalid Gemini response');
  }

  return firstCandidate.content.parts[0].text || '';
}

export function parseGeminiJSON<T>(text: string): T {
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/s);
  
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('No valid JSON found');
  }

  return JSON.parse(jsonMatch[1]) as T;
}
