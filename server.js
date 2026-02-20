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
        },
        personCount: {
            type: Type.NUMBER,
            description: "Number of people detected in the image."
        }
    },
    required: ["analysisSuccess", "heightCm", "weightKg", "accuracy", "personCount"]
};

app.post('/api/analyze', async (req, res) => {
    const { base64Image, referenceObject } = req.body;

    if (!base64Image) {
        return res.status(400).json({ error: 'base64Image is required' });
    }

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
        },
    };

    const refContext = referenceObject && referenceObject !== 'none'
        ? `\nREFERENCE OBJECT DETECTED: The user confirms a "${referenceObject}" is visible in the image. Use its known dimensions for absolute scale calibration:\n- Standard door frame: 200cm tall, 80cm wide\n- Door handle height: 100cm from floor\n- Light switch: 110cm from floor\n- Standard refrigerator: 170cm tall\nThis reference MUST be your primary scale anchor. Measure the subject relative to it.\n`
        : '';

    const textPart = {
        text: `ACT AS A SENIOR BIOMETRIC SPECIALIST AND ANTHROPOMETRIST.
Your goal is to provide the MOST ACCURATE height and weight estimation possible from this image.
${refContext}
===== STEP 1: PERSON VALIDATION =====
- Count people in the image → return as personCount.
- If 0 people: return analysisSuccess false, reason 'no_person_detected'.
- If >1 person: return analysisSuccess false, reason 'multiple_people'.
- If image too dark/blurry: return analysisSuccess false, reason 'image_unclear'.
- If child detected: return analysisSuccess false, reason 'child_detected'.
- If exactly 1 adult: proceed to Step 2.

===== STEP 2: HEIGHT ESTIMATION (USE ALL METHODS, THEN AVERAGE) =====

**Method A — Environmental Scale Calibration:**
- Identify ANY known-size objects: door frames (200cm), light switches (110cm), 
  floor tiles (30-60cm), chair seats (45cm), standard desks (75cm), ceiling height (~250cm).
- Calculate the subject's height relative to these objects.

**Method B — Anthropometric Head-Count Method:**
- Measure the subject's head height (top of skull to chin) in the image.
- Adult height = head_height × multiplier:
  - Average build: 7.5 heads tall
  - Athletic/tall: 8.0 heads tall
  - Stocky/short: 7.0 heads tall
- Calculate height from this.

**Method C — Body Proportion Cross-Check:**
- Arm span (fingertip to fingertip) ≈ height (within ±2cm for most adults)
- Shoulder width ≈ height / 4
- Leg length (hip to floor) ≈ height × 0.47
- Trunk length (shoulder to hip) ≈ height × 0.30
- Use visible limb proportions to cross-check your estimate.

**FINAL HEIGHT:** Average results from all available methods. Prefer Method A if a reference object is clearly visible. Round to nearest 0.5cm.

===== STEP 3: WEIGHT ESTIMATION =====

**Step 3a — Determine Build Type (from visual analysis ONLY, do NOT ask the user):**
- ECTOMORPH (lean): narrow shoulders, visible bone structure, thin limbs → lower weight
- MESOMORPH (athletic): broad shoulders, visible muscle definition, V-taper → moderate-high weight  
- ENDOMORPH (heavier): wide waist, rounded limbs, soft tissue visible → higher weight
- Note: many people are mixed types.

**Step 3b — Frame Size Assessment:**
- Small frame: narrow wrists, narrow shoulders relative to hips
- Medium frame: proportional wrists and shoulders
- Large frame: thick wrists, broad shoulders, wide ribcage
- Frame size affects weight by ±5-8kg for same height.

**Step 3c — Body Composition Indicators:**
- Visible muscle definition (deltoids, forearms, calves) → add 5-15kg over "average" weight
- Visible adipose tissue (belly overhang, arm thickness, face roundness, double chin) → add 8-25kg
- Lean with no muscle definition → subtract 3-8kg from average
- Clothing can hide 3-5kg of body mass — account for loose/tight clothing.

**Step 3d — Weight Formula:**
- Base weight estimate: (height_cm - 100) × 0.9 for medium frame
- Adjust: small frame → ×0.90, large frame → ×1.10
- Then adjust for visible body composition from Step 3c.
- Cross-check: BMI should typically fall between 18.5 and 35 for adults.

===== STEP 4: PERSPECTIVE CORRECTION =====
- Low angle (camera below eye level): subject appears taller → adjust height DOWN 1-3cm
- High angle (camera above eye level): subject appears shorter → adjust height UP 1-3cm
- Barrel distortion (wide-angle lens): edges stretched → subjects near edges appear wider
- If only upper body visible: estimate is less reliable → set accuracy to 'low'

===== OUTPUT =====
Return ONLY the JSON object with your best estimates. Be precise — do not round to nearest 5 or 10.`
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
