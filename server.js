import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
function loadEnvLocal() {
    const envPath = path.resolve(__dirname, '.env.local');
    try {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            let value = trimmed.slice(eqIdx + 1).trim();
            // Strip surrounding quotes
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    } catch {
        console.warn('Warning: .env.local not found.');
    }
}
loadEnvLocal();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Parse JSON bodies up to 50MB (for base64 images)
app.use(express.json({ limit: '50mb' }));

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY (or VITE_GEMINI_API_KEY) is not set in .env.local!');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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

app.post('/api/analyze', async (req, res) => {
    const { base64Image } = req.body;

    if (!base64Image) {
        return res.status(400).json({ error: 'base64Image is required' });
    }

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
    - Analyze **Muscle Mass vs. Adiposity**: Look at deltoid definition, forearm vascularity, and abdominal structure.
    - A muscular person will weigh 15-20% MORE than a non-muscular person of the same outline.
    - Analyze **Bone Structure**: Wrist thickness and ankle width indicate frame size (small/medium/large).

3.  **PERSPECTIVE CORRECTION:**
    - If feet are closer to camera than head, subject appears taller. Adjust height DOWN.
    - If shooting from above, subject appears shorter. Adjust height UP.

OUTPUT REQUIREMENTS:
- If child detected: return analysisSuccess false with reason 'child_detected'.
- Return ONLY the JSON object.`
    };

    try {
        console.log('📸 Analyzing image via Gemini API (server-side)...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const rawText = response.text;
        if (!rawText) {
            return res.status(500).json({ error: 'Empty response from Gemini API' });
        }

        const jsonText = rawText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const data = JSON.parse(jsonText);

        if (!data.analysisSuccess) {
            return res.status(422).json({ error: data.reason || 'Unable to analyze image.' });
        }

        console.log(`✅ Analysis complete: ${data.heightCm}cm, ${data.weightKg}kg (${data.accuracy})`);
        res.json({
            heightCm: data.heightCm,
            weightKg: data.weightKg,
            accuracy: data.accuracy,
        });

    } catch (error) {
        console.error('❌ Gemini API Error:', error.message);

        if (error.message?.includes('quota') || error.message?.includes('429')) {
            return res.status(429).json({ error: 'API quota exceeded. Please wait and try again.' });
        }
        if (error.message?.includes('API_KEY_INVALID')) {
            return res.status(401).json({ error: 'Invalid API key.' });
        }

        res.status(500).json({ error: error.message || 'Server error during analysis.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API proxy server running on http://localhost:${PORT}`);
    console.log(`   Using model: gemini-2.5-flash`);
    console.log(`   API Key: ${API_KEY.substring(0, 8)}...`);
});
