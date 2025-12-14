import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image with context.
 */
export const analyzeImage = async (
  base64Image: string, 
  prompt: string, 
  systemInstruction?: string
): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    return ""; 
  }
};

/**
 * Checks for immediate safety hazards.
 */
export const checkSafety = async (base64Image: string): Promise<string | null> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Is there an immediate physical danger, obstacle, or wrong direction? Answer with 'STOP: [Reason]' or 'SAFE'." }
        ]
      }
    });
    const text = response.text || "";
    return text.startsWith("STOP") ? text : null;
  } catch (e: any) {
    return null;
  }
};

/**
 * Uses Google Maps Grounding to answer location-based questions.
 */
export const askLocationQuery = async (query: string, lat: number, lng: number): Promise<string> => {
  try {
    // Construct a strong prompt to force the tool usage context
    const textPrompt = `I am at latitude ${lat}, longitude ${lng}. User asks: "${query}". Find this place nearby using Google Maps and tell me exactly where it is and how to get there.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: textPrompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    return response.text || "I found the location but could not generate a description.";
  } catch (error: any) {
    console.error("Gemini Maps Error:", error);
    return "I am unable to access navigation systems at the moment.";
  }
};

/**
 * Simulates a Kestra AI Agent summarizing data from multiple systems.
 */
export const runKestraAgentAnalysis = async (systemData: any): Promise<{ summary: string; decision: 'NORMAL' | 'WARNING' | 'CRITICAL' }> => {
  try {
    const prompt = `
      You are an automated Kestra AI Agent responsible for system orchestration.
      Summarize the following aggregated telemetry data from external systems (Biometrics, Environment, Hardware):
      ${JSON.stringify(systemData, null, 2)}

      Instructions:
      1. Provide a "summary" (max 15 words) describing the current user and system state.
      2. Make a "decision" on operational status: 'NORMAL' (all good), 'WARNING' (minor issues), or 'CRITICAL' (health or safety risk).

      Return strictly valid JSON in this format:
      { "summary": "...", "decision": "..." }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { 
        responseMimeType: "application/json" 
      }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Kestra Agent Error:", error);
    return { summary: "Agent data link failure.", decision: "WARNING" };
  }
};