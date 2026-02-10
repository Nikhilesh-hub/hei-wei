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

ANALYSIS PROTOCOL:
1.  SKELETAL MAPPING: Identify joints (ankles, knees, hips, shoulders, vertex).
2.  PROPORTIONAL SCALING: Use the 'Heads-to-Height' ratio (standard adult is approx 7.5 heads tall).
3.  PERSPECTIVE CORRECTION: Analyze the floor line and camera tilt. If the camera is at chest level, use standard vertical scaling.
4.  VOLUMETRIC ESTIMATION: Calculate Body Mass Index based on visible frame width and muscularity/adiposity markers to determine weight.

IMAGE REQUIREMENTS:
- If it's a child, return analysisSuccess: false with reason 'child_detected'.
- If the feet or head are cut off, return accuracy: 'low'.
- If full body is visible and posture is straight, return accuracy: 'high'.

OUTPUT:
Return ONLY the JSON object.`
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
        const jsonText = response.text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
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