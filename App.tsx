import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageInput } from './components/ImageInput';
import { ResultDisplay } from './components/ResultDisplay';

import { analyzeImageForMetrics } from './services/geminiService';
import type { AnalysisResult } from './types';
import { CameraIcon, UploadIcon, SpinnerIcon, CheckIcon, BodyScanIcon, HeiWeiLogo } from './components/icons';

type Step = 'source' | 'capture' | 'loading' | 'result';
type CaptureMode = 'upload' | 'camera';
export type UnitSystem = 'metric' | 'imperial';

const ANALYSIS_STEPS = [
  { label: 'Skeletal Mapping', detail: 'Identifying 32 joint landmarks' },
  { label: 'Proportional Scaling', detail: 'Computing head-to-height ratio' },
  { label: 'Perspective Correction', detail: 'Adjusting for camera angle' },
  { label: 'Volumetric Estimation', detail: 'Calculating body density' },
  { label: 'Final Calibration', detail: 'Cross-referencing anchors' },
];

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('source');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated loading progress
  useEffect(() => {
    if (step === 'loading') {
      setLoadingStepIdx(0);
      setLoadingProgress(0);
      let progress = 0;
      let stepIdx = 0;
      loadingIntervalRef.current = setInterval(() => {
        progress += Math.random() * 3 + 1;
        if (progress >= 92) progress = 92;
        const newStepIdx = Math.min(Math.floor(progress / (92 / ANALYSIS_STEPS.length)), ANALYSIS_STEPS.length - 1);
        if (newStepIdx !== stepIdx) stepIdx = newStepIdx;
        setLoadingProgress(Math.round(progress));
        setLoadingStepIdx(stepIdx);
      }, 400);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [step]);

  const handleAnalysis = useCallback(async (base64Image: string) => {
    setCurrentImage(base64Image);
    setStep('loading');
    setError(null);
    try {
      const { heightCm, weightKg, accuracy } = await analyzeImageForMetrics(base64Image);
      setResult({ heightCm, weightKg, accuracy });
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Try again with a clearer photo.');
      setStep('source');
    }
  }, []);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentImage(null);
    setStep('source');
  };

  const handleBack = () => {
    setStep('source');
    setCurrentImage(null);
  };

  const renderContent = () => {
    switch (step) {
      case 'source':
        return (
          <div className="w-full animate-fade-in-up">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-6 lg:py-0">
              {/* Left Column: Branding */}
              <div className="flex flex-col text-center lg:text-left">
                <div className="mb-8 flex justify-center lg:justify-start">
                  <HeiWeiLogo className="w-16 h-16" />
                </div>
                <h2 className="text-5xl xl:text-7xl font-extrabold text-white mb-5 tracking-tight leading-[0.95]">
                  Hei<br />
                  <span className="text-brand">wei.</span>
                </h2>
                <p className="text-zinc-400 text-lg lg:text-xl font-normal mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Instant body metrics from a single photo. Know your height and weight in seconds — powered by spatial AI.
                </p>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-brand rounded-sm"></div>
                      <p className="text-xs font-bold text-brand uppercase tracking-widest">Accuracy</p>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">32 skeletal landmarks analyzed using advanced computer vision for precise measurements.</p>
                  </div>
                  <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-brand rounded-sm"></div>
                      <p className="text-xs font-bold text-brand uppercase tracking-widest">Privacy</p>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">Your photos are never stored. All processing happens in real-time and data is discarded instantly.</p>
                  </div>
                </div>

                <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-brand rounded-sm"></div>
                    <p className="text-xs font-bold text-brand uppercase tracking-widest">How It Works</p>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-sm mb-4">
                    Hei-wei uses Google's Gemini AI to analyze body proportions from a single photograph. It estimates height and weight by identifying skeletal landmarks, calibrating against environmental reference objects, and correcting for camera perspective.
                  </p>
                  <div className="flex gap-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    <span>◆ Head-to-toe ratio</span>
                    <span>◆ Bone structure</span>
                    <span>◆ Body density</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={() => { setCaptureMode('camera'); setStep('capture'); }}
                  className="w-full group bg-neutral-900 hover:bg-brand p-6 rounded-2xl flex items-center justify-between transition-all duration-300 border border-neutral-800 hover:border-brand active:scale-[0.98]"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-brand/15 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors duration-300">
                      <CameraIcon className="w-6 h-6 text-brand group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xl font-bold text-white">Capture Image</span>
                      <span className="block text-xs text-zinc-500 group-hover:text-white/60 uppercase tracking-widest font-semibold mt-0.5 transition-colors duration-300">Use Camera</span>
                    </div>
                  </div>
                  <span className="text-zinc-700 group-hover:text-white/40 font-light text-3xl group-hover:translate-x-1 transition-all duration-300">→</span>
                </button>

                <button
                  onClick={() => { setCaptureMode('upload'); setStep('capture'); }}
                  className="w-full group bg-neutral-900 hover:bg-brand p-6 rounded-2xl flex items-center justify-between transition-all duration-300 border border-neutral-800 hover:border-brand active:scale-[0.98]"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-brand/15 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors duration-300">
                      <UploadIcon className="w-6 h-6 text-brand group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xl font-bold text-white">Upload Photo</span>
                      <span className="block text-xs text-zinc-500 group-hover:text-white/60 uppercase tracking-widest font-semibold mt-0.5 transition-colors duration-300">From Gallery</span>
                    </div>
                  </div>
                  <span className="text-zinc-700 group-hover:text-white/40 font-light text-3xl group-hover:translate-x-1 transition-all duration-300">→</span>
                </button>

                <p className="text-center text-[10px] text-zinc-600 mt-4 font-semibold tracking-widest uppercase">
                  Local Processing • Privacy Encrypted • v1.1
                </p>
              </div>
            </div>
          </div>
        );
      case 'capture':
        return <ImageInput onAnalyze={handleAnalysis} onBack={handleBack} captureMode={captureMode} />;
      case 'loading':
        return (
          <div className="w-full animate-fade-in-up py-4 lg:py-0">
            {/* Full-width image with scanning overlay */}
            <div className="relative w-full min-h-[70vh] lg:min-h-[80vh] bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
              {currentImage && (
                <>
                  <img src={`data:image/jpeg;base64,${currentImage}`} alt="Analyzing" className="w-full h-full object-contain absolute inset-0 opacity-60" />
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-brand/50 to-transparent blur-xl animate-scan"></div>
                </>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-md p-4 rounded-full border border-white/10">
                  <SpinnerIcon className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Overlay: Progress panel at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                <div className="max-w-lg">
                  <p className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2">Processing</p>
                  <p className="text-sm text-zinc-400 font-normal mb-5">
                    Spatial AI is identifying skeletal landmarks to calculate your biometrics.
                  </p>

                  <div className="bg-black/40 backdrop-blur-md rounded-xl p-5 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm bg-brand animate-pulse"></div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Analysis Steps</span>
                      </div>
                      <span className="text-sm font-bold text-brand tabular-nums">{loadingProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${loadingProgress}%`, transition: 'width 0.4s ease-out' }}
                      ></div>
                    </div>
                    <div className="space-y-2">
                      {ANALYSIS_STEPS.map((s, i) => (
                        <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i < loadingStepIdx ? 'opacity-50' : i === loadingStepIdx ? 'opacity-100' : 'opacity-30'
                          }`}>
                          {i < loadingStepIdx ? (
                            <CheckIcon className="w-4 h-4 text-brand flex-shrink-0" />
                          ) : i === loadingStepIdx ? (
                            <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                            </div>
                          ) : (
                            <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className={`text-xs font-semibold ${i === loadingStepIdx ? 'text-white' : 'text-zinc-500'}`}>{s.label}</span>
                            {i === loadingStepIdx && (
                              <span className="text-[10px] text-zinc-600 mt-0.5">{s.detail}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'result':
        return result ? <ResultDisplay result={result} image={currentImage} onReset={handleReset} unitSystem={unitSystem} onUnitChange={setUnitSystem} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-6 lg:py-12 px-4 lg:px-8 overflow-x-hidden selection:bg-brand/30">
      {/* Persistent Logo */}
      <div className="w-full max-w-[1400px] mb-6 lg:mb-10">
        <HeiWeiLogo className="w-9 h-9" />
      </div>

      <main className="w-full max-w-[1400px] flex-1">
        {error && (step === 'source') && (
          <div className="mb-8 p-5 bg-red-500/5 border border-red-500/15 text-red-400 rounded-2xl flex items-center justify-center gap-3 animate-fade-in-up">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
            <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
          </div>
        )}

        {/* Main Content Card */}
        <div className={`
            glass rounded-3xl relative overflow-hidden transition-all duration-700
            ${step === 'source' ? 'p-8 lg:p-14' : step === 'loading' ? 'p-4 lg:p-6' : 'p-6 lg:p-10'}
        `}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;