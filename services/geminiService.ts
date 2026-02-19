import type { GeminiAnalysisResponse } from '../types';

export async function analyzeImageForMetrics(base64Image: string): Promise<{ heightCm: number; weightKg: number; accuracy: 'high' | 'medium' | 'low' }> {
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server error (${response.status})`);
    }

    const data: { heightCm: number; weightKg: number; accuracy: 'high' | 'medium' | 'low' } = await response.json();
    return data;
}