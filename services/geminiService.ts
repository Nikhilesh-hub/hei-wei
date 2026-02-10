import { GoogleGenAI, Type } from "@google/genai";
import type { GeminiAnalysisResponse } from '../types';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        analysisSuccess: {
            type: Type.BOOLEAN,
            description: "True if a clear adult subject is found and analyzed."
        },
        heightCm: {
            type: Type.NUMBER,
            description: "Calculated height in cm based on skeletal proportions."
        },
        weightKg: {
            type: Type.NUMBER,
            description: "Calculated weight in kg based on body volume and density estimation."
        },
        accuracy: {
            type: Type.STRING,
            description: "Confidence level: 'high', 'medium', or 'low'."
        },
        reason: {
            type: Type.STRING,
            description: "Failure reason if success is false."
        }
    },
    required: ["analysisSuccess", "heightCm", "weightKg", "accuracy"]
};

export async function analyzeImageForMetrics(base64Image: string): Promise<{ heightCm: number; weightKg: number; accuracy: 'high' | 'medium' | 'low' }> {
    // standard Vite env vars
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''; // Fallback to empty string to avoid crash, handle validation later
    const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';

    if (!API_KEY) {
        console.error("VITE_GEMINI_API_KEY is missing! Please check your .env file or Vercel settings.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const textPart = {
        text: `ACT AS A SENIOR BIOMETRIC SPECIALIST. 
Your goal is to provide a HIGHLY ACCURATE height and weight estimation.

CRITICAL ANALYSIS PROTOCOL:
1.  **SCALE CALIBRATION (CRITICAL):**
    - Search for standard environmental objects to anchor scale:
      - Door frames (~200cm height)
      - Light switches (~110cm height)
      - Floor tiles (~30-60cm)
      - Chair seats (~45cm)
    - Use these anchors to determine absolute height.

2.  **BODY COMPOSITION ANALYSIS:**
    - Do NOT default to "average" BMI.
    - Analyze **Muscle Mass vs. Adiiposity**: Look at deltoid definition, forearm vascularity, and abdominal structure.
    - A muscular person will weigh 15-20% MORE than a non-muscular person of the same outline.
    - Analyze **Bone Structure**: Wrist thickness and ankle width indicate frame size (small/medium/large).

3.  **PERSPECTIVE CORRECTION:**
    - If feet are closer to camera than head, subject appears taller. Adjust height DOWN.
    - If shooting from above, subject appears shorter. Adjust height UP.

OUTPUT REQUIREMENTS:
- If child detected: review status 'child_detected'.
- Return ONLY the JSON object.`
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        // Robust cleanup: remove markdown code fences if present (e.g. ```json ... ```)
        const rawText = response.text;
        if (!rawText) throw new Error("Empty response from AI");
        const jsonText = rawText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const data: GeminiAnalysisResponse = JSON.parse(jsonText);

        if (!data.analysisSuccess) {
            throw new Error(data.reason || "Unable to analyze image.");
        }

        return {
            heightCm: data.heightCm,
            weightKg: data.weightKg,
            accuracy: data.accuracy,
        };

    } catch (error: any) {
        console.error("Gemini Error:", error);
        if (error.message?.includes("entity was not found")) {
            throw new Error("API configuration error. Please ensure a valid paid project key is used.");
        }
        throw new Error(error.message || "The AI encountered an error during precision analysis.");
    }
}