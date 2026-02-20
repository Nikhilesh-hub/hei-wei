import React, { useState, useCallback, useRef } from 'react';
import { analyzeImageForMetrics } from '../services/geminiService';
import { resizeImage } from '../utils/imageUtils';
import { SpinnerIcon, ArrowLeftIcon } from './icons';

interface ComparisonResult {
    heightCm: number;
    weightKg: number;
    accuracy: 'high' | 'medium' | 'low';
}

interface ComparisonModeProps {
    onBack: () => void;
}

export const ComparisonMode: React.FC<ComparisonModeProps> = ({ onBack }) => {
    const [beforeImage, setBeforeImage] = useState<string | null>(null);
    const [afterImage, setAfterImage] = useState<string | null>(null);
    const [beforeResult, setBeforeResult] = useState<ComparisonResult | null>(null);
    const [afterResult, setAfterResult] = useState<ComparisonResult | null>(null);
    const [analyzing, setAnalyzing] = useState<'before' | 'after' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const beforeRef = useRef<HTMLInputElement>(null);
    const afterRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File | null, slot: 'before' | 'after') => {
        if (!file || !file.type.startsWith('image/')) return;
        try {
            const base64 = await resizeImage(file);
            if (slot === 'before') {
                setBeforeImage(base64);
                setBeforeResult(null);
            } else {
                setAfterImage(base64);
                setAfterResult(null);
            }
        } catch (err) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const b64 = (e.target?.result as string)?.split(',')[1];
                if (b64) {
                    if (slot === 'before') { setBeforeImage(b64); setBeforeResult(null); }
                    else { setAfterImage(b64); setAfterResult(null); }
                }
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const analyze = useCallback(async (base64: string, slot: 'before' | 'after') => {
        setAnalyzing(slot);
        setError(null);
        try {
            const result = await analyzeImageForMetrics(base64);
            if (slot === 'before') setBeforeResult(result);
            else setAfterResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        }
        setAnalyzing(null);
    }, []);

    const handleAnalyzeBoth = useCallback(async () => {
        if (beforeImage && !beforeResult) await analyze(beforeImage, 'before');
        if (afterImage && !afterResult) await analyze(afterImage, 'after');
    }, [beforeImage, afterImage, beforeResult, afterResult, analyze]);

    const diffHeight = beforeResult && afterResult ? afterResult.heightCm - beforeResult.heightCm : null;
    const diffWeight = beforeResult && afterResult ? afterResult.weightKg - beforeResult.weightKg : null;

    const formatDiff = (val: number | null, unit: string) => {
        if (val === null) return '—';
        const sign = val > 0 ? '+' : '';
        return `${sign}${val.toFixed(1)} ${unit}`;
    };

    return (
        <div className="w-full animate-fade-in-up py-4 lg:py-0">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 px-4 py-2.5 rounded-xl border border-neutral-700"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                </button>
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Compare Mode</h2>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/5 border border-red-500/15 text-red-400 rounded-xl text-base font-bold">
                    {error}
                </div>
            )}

            {/* Upload Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Before */}
                <div className="flex flex-col">
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Before</p>
                    <div
                        className={`relative aspect-[3/4] bg-neutral-900 rounded-2xl border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-all ${beforeImage ? 'border-brand/30' : 'border-neutral-700 hover:border-neutral-500'}`}
                        onClick={() => beforeRef.current?.click()}
                    >
                        {beforeImage ? (
                            <img src={`data:image/jpeg;base64,${beforeImage}`} alt="Before" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center p-4">
                                <div className="text-4xl mb-3">📸</div>
                                <p className="text-zinc-400 text-base font-semibold">Upload Before Photo</p>
                            </div>
                        )}
                        {analyzing === 'before' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                <SpinnerIcon className="w-10 h-10 text-white" />
                            </div>
                        )}
                        <input type="file" accept="image/*" ref={beforeRef} onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null, 'before')} className="hidden" />
                    </div>
                    {beforeResult && (
                        <div className="mt-3 bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                            <p className="text-sm text-brand font-bold uppercase tracking-widest mb-2">Results</p>
                            <p className="text-white font-black text-lg">{beforeResult.heightCm.toFixed(0)} cm / {beforeResult.weightKg.toFixed(1)} kg</p>
                        </div>
                    )}
                </div>

                {/* After */}
                <div className="flex flex-col">
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">After</p>
                    <div
                        className={`relative aspect-[3/4] bg-neutral-900 rounded-2xl border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-all ${afterImage ? 'border-brand/30' : 'border-neutral-700 hover:border-neutral-500'}`}
                        onClick={() => afterRef.current?.click()}
                    >
                        {afterImage ? (
                            <img src={`data:image/jpeg;base64,${afterImage}`} alt="After" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center p-4">
                                <div className="text-4xl mb-3">📸</div>
                                <p className="text-zinc-400 text-base font-semibold">Upload After Photo</p>
                            </div>
                        )}
                        {analyzing === 'after' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                <SpinnerIcon className="w-10 h-10 text-white" />
                            </div>
                        )}
                        <input type="file" accept="image/*" ref={afterRef} onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null, 'after')} className="hidden" />
                    </div>
                    {afterResult && (
                        <div className="mt-3 bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                            <p className="text-sm text-brand font-bold uppercase tracking-widest mb-2">Results</p>
                            <p className="text-white font-black text-lg">{afterResult.heightCm.toFixed(0)} cm / {afterResult.weightKg.toFixed(1)} kg</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Analyze Button */}
            {(beforeImage || afterImage) && !(beforeResult && afterResult) && (
                <div className="flex justify-center mb-8">
                    <button
                        onClick={handleAnalyzeBoth}
                        disabled={analyzing !== null}
                        className="bg-brand hover:bg-brand-light text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {analyzing ? <SpinnerIcon className="w-5 h-5" /> : null}
                        {analyzing ? 'Analyzing...' : 'Analyze Both'}
                    </button>
                </div>
            )}

            {/* Comparison Results */}
            {beforeResult && afterResult && (
                <div className="bg-neutral-900 rounded-2xl p-6 lg:p-8 border border-neutral-800">
                    <p className="text-sm font-bold text-brand uppercase tracking-widest mb-6">Changes</p>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-2">Height</p>
                            <p className={`text-3xl font-black ${diffHeight! > 0 ? 'text-green-400' : diffHeight! < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                {formatDiff(diffHeight, 'cm')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-2">Weight</p>
                            <p className={`text-3xl font-black ${diffWeight! < 0 ? 'text-green-400' : diffWeight! > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                {formatDiff(diffWeight, 'kg')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
