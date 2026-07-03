import { GoogleGenAI } from '@google/genai';

const aiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

console.log("[GEMINI_SERVICE_INIT] Checking local environment token mapping...");
if (!aiApiKey) {
  console.error("[GEMINI_SERVICE_INIT] [CRITICAL] VITE_GEMINI_API_KEY key is missing inside your .env file!");
} else {
  console.log("[GEMINI_SERVICE_INIT] [OK] Token detected successfully.");
}

const ai = new GoogleGenAI({ apiKey: aiApiKey });

export const compileNeuralLearningPath = async (userPrompt, depthLevel) => {
  console.log(`[GEMINI_SERVICE_CALL] Executing with userPrompt: "${userPrompt}" | Level: "${depthLevel}"`);
  
  if (!aiApiKey) {
    console.error("[GEMINI_SERVICE_CALL] Aborting block. VITE_GEMINI_API_KEY is completely missing.");
    throw new Error("Missing VITE_GEMINI_API_KEY configuration flag inside .env variables mapping.");
  }

  const strategicInstructions = `
    You are an AI Curriculum Engineer. Create a personalized learning roadmap for: "${userPrompt}" matching track level: "${depthLevel}".
    Structure a strict day-wise chronological matrix mapping exactly 4 days.
    
    CRITICAL RULES:
    1. Day 1 must have status: "unlocked". Days 2, 3, and 4 must have status: "locked".
    2. Do NOT include actual full test questions banks. Provide short titles inside 'quizTopic' and 'assignmentObjective' keys.
    
    Return ONLY a single valid JSON object following the schema constraint rules.
  `;

  try {
    console.log("[GEMINI_SERVICE_CALL] Sending payload handshake to Google serversless gateway...");
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: strategicInstructions,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            level: { type: 'STRING' },
            modules: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  dayId: { type: 'INTEGER' },
                  title: { type: 'STRING' },
                  status: { type: 'STRING' },
                  duration: { type: 'STRING' },
                  objective: { type: 'STRING' },
                  topics: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  },
                  schedules: {
                    type: 'OBJECT',
                    properties: {
                      quiz: {
                        type: 'OBJECT',
                        properties: {
                          name: { type: 'STRING' },
                          quizTopic: { type: 'STRING' },
                          duration: { type: 'STRING' }
                        },
                        required: ['name', 'quizTopic', 'duration']
                      },
                      assignment: {
                        type: 'OBJECT',
                        properties: {
                          name: { type: 'STRING' },
                          assignmentObjective: { type: 'STRING' },
                          complexity: { type: 'STRING' }
                        },
                        required: ['name', 'assignmentObjective', 'complexity']
                      }
                    },
                    required: ['quiz', 'assignment']
                  }
                },
                required: ['dayId', 'title', 'status', 'duration', 'objective', 'topics', 'schedules']
              }
            }
          },
          required: ['title', 'level', 'modules']
        }
      }
    });

    console.log("[GEMINI_SERVICE_CALL] Raw response text arrived from API instance:");
    console.log(response.text);

    let cleanText = response.text.trim();
    
    // Safety check for raw code block annotations
    if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
    else if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);

    console.log("[GEMINI_SERVICE_CALL] Sanitization finished. Attempting standard JSON parsing loop...");
    const parsedData = JSON.parse(cleanText.trim());
    
    console.log("[GEMINI_SERVICE_CALL] [SUCCESS] JSON data structure successfully hydrated:", parsedData);
    return parsedData;

  } catch (error) {
    console.error("[GEMINI_SERVICE_CALL] [CRITICAL_FAIL] Error occurred inside execution pipeline block:", error);
    throw error;
  }
};