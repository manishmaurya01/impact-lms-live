let currentKeyIndex = 0;

const getAvailableKeys = (passedKey) => {
  let keys = [];
  
  // 1. Check if user configured a comma-separated list of API keys
  if (process.env.GEMINI_API_KEYS) {
    keys = process.env.GEMINI_API_KEYS.split(',')
      .map(k => k.trim())
      .filter(Boolean);
  }
  
  // 2. Fall back to individual keys defined in environment variables or passed parameter
  if (keys.length === 0) {
    if (passedKey) keys.push(passedKey);
    if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_SECONDARY_KEY) keys.push(process.env.GEMINI_SECONDARY_KEY);
    if (process.env.GEMINI_INTERVIEW_KEY) keys.push(process.env.GEMINI_INTERVIEW_KEY);
    
    // Deduplicate keys while maintaining original order
    keys = [...new Set(keys)];
  }
  
  return keys;
};

const callGeminiAPI = async (apiKey, userQuery, systemPrompt, customSchema) => {
  const keys = getAvailableKeys(apiKey);
  
  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured. Please set GEMINI_API_KEYS or GEMINI_API_KEY in your backend .env file.");
  }
  
  let attempts = 0;
  const maxAttempts = keys.length;
  
  while (attempts < maxAttempts) {
    const activeIndex = currentKeyIndex % keys.length;
    const activeKey = keys[activeIndex];
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;
      const requestPayload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json", responseSchema: customSchema }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw { status: response.status, message: errText };
      }
      
      const responseData = await response.json();
      const outputText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!outputText) {
        throw new Error("Empty response parts from Gemini API gateway.");
      }
      
      return outputText;
    } catch (error) {
      console.warn(`[GEMINI WARNING] Key index ${activeIndex} failed with status/error: ${error.status || error.message || error}.`);
      
      // Rotate index to the next key
      currentKeyIndex = (activeIndex + 1) % keys.length;
      attempts++;
      
      if (attempts < maxAttempts) {
        console.log(`[GEMINI ROTATION] Rotating to API key index ${currentKeyIndex % keys.length} (Attempt ${attempts + 1}/${maxAttempts})...`);
      } else {
        throw new Error(`All configured Gemini API keys (${maxAttempts}) were exhausted or failed. Last error: ${error.status || ''} - ${error.message || error}`);
      }
    }
  }
};

module.exports = { callGeminiAPI };