import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageInput } from './components/ImageInput';
import { ResultDisplay } from './components/ResultDisplay';
import { Confetti } from './components/Confetti';
import { Onboarding } from './components/Onboarding';
import { ImageCropper } from './components/ImageCropper';
import { ComparisonMode } from './components/ComparisonMode';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GooeyText } from '@/components/ui/gooey-text-morphing';

import { analyzeImageForMetrics } from './services/geminiService';
import type { AnalysisResult } from './types';
import { CameraIcon, UploadIcon, SpinnerIcon, CheckIcon, BodyScanIcon, HeiWeiLogo, RetryIcon, AlertTriangleIcon, SunIcon, MoonIcon } from './components/icons';
import { useTheme } from './components/ThemeContext';

type Step = 'source' | 'capture' | 'crop' | 'loading' | 'result' | 'error' | 'compare';
type CaptureMode = 'upload' | 'camera';
export type UnitSystem = 'metric' | 'imperial';

// Map error messages to user-friendly guidance
const getErrorGuidance = (error: string): { title: string; tips: string[] } => {
  const lower = error.toLowerCase();
  if (lower.includes('no_person') || lower.includes('no person')) {
    return { title: 'No person detected', tips: ['Make sure your full body is in the frame', 'Stand in a well-lit area', 'Avoid busy backgrounds'] };
  }
  if (lower.includes('child')) {
    return { title: 'Child detected', tips: ['This app is designed for adults only', 'Please upload a photo of an adult'] };
  }
  if (lower.includes('dark') || lower.includes('unclear') || lower.includes('image_unclear')) {
    return { title: 'Image too unclear', tips: ['Use brighter, even lighting', 'Avoid backlit or silhouette photos', 'Hold the camera steady'] };
  }
  if (lower.includes('multiple') || lower.includes('multiple_people')) {
    return { title: 'Multiple people detected', tips: ['Only one person should be in the photo', 'Crop the image to show just one person', 'Take a new photo with only you in frame'] };
  }
  if (lower.includes('quota') || lower.includes('429')) {
    return { title: 'Service busy', tips: ['Too many requests right now', 'Wait a moment and try again', 'Try during off-peak hours'] };
  }
  if (lower.includes('api_key') || lower.includes('401')) {
    return { title: 'Authentication error', tips: ['Server configuration issue', 'Please try again later'] };
  }
  return { title: 'Analysis failed', tips: ['Ensure full body (head to toe) is visible', 'Use good lighting and a clear background', 'Try a different photo'] };
};

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
  const [referenceObject, setReferenceObject] = useState<string>('none');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
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

  const handleImageCaptured = useCallback((base64Image: string) => {
    setCurrentImage(base64Image);
    setStep('crop');
  }, []);

  const handleCropComplete = useCallback((croppedBase64: string) => {
    handleAnalysis(croppedBase64);
  }, []);

  const handleSkipCrop = useCallback(() => {
    if (currentImage) handleAnalysis(currentImage);
  }, [currentImage]);

  const handleAnalysis = useCallback(async (base64Image: string) => {
    setCurrentImage(base64Image);
    setStep('loading');
    setError(null);
    try {
      const { heightCm, weightKg, accuracy } = await analyzeImageForMetrics(base64Image, referenceObject);
      setResult({ heightCm, weightKg, accuracy });
      setStep('result');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Try again with a clearer photo.');
      setStep('error');
    }
  }, [referenceObject]);

  const handleRetry = useCallback(() => {
    if (currentImage) {
      handleAnalysis(currentImage);
    }
  }, [currentImage, handleAnalysis]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentImage(null);
    setReferenceObject('none');
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
                <h2 className="text-5xl xl:text-7xl font-extrabold text-white mb-2 tracking-tight leading-[0.95]">
                  Hei<span className="text-brand">wei.</span>
                </h2>
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-8 h-8">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Spatial AI for</span>
                  <GooeyText
                    texts={["Anthropometrics", "Biometrics", "Body Analysis", "Height & Weight", "Instant Metrics"]}
                    className="text-brand h-full"
                    textClassName="text-[10px] sm:text-xs font-bold uppercase tracking-widest"
                  />
                </div>
                <p className="text-zinc-400 text-lg lg:text-xl font-normal mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Instant body metrics from a single photo. Know your height and weight in seconds — powered by spatial AI.
                </p>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 hover-lift">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-brand rounded-sm"></div>
                      <p className="text-sm font-bold text-brand uppercase tracking-widest">Accuracy</p>
                    </div>
                    <p className="text-zinc-400 text-base leading-relaxed">32 skeletal landmarks analyzed using advanced computer vision for precise measurements.</p>
                  </div>
                  <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 hover-lift">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-brand rounded-sm"></div>
                      <p className="text-sm font-bold text-brand uppercase tracking-widest">Privacy</p>
                    </div>
                    <p className="text-zinc-400 text-base leading-relaxed">Your photos are never stored. All processing happens in real-time and data is discarded instantly.</p>
                  </div>
                </div>

                <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-brand rounded-sm"></div>
                    <p className="text-sm font-bold text-brand uppercase tracking-widest">How It Works</p>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-base mb-4">
                    Hei-wei uses Google's Gemini AI to analyze body proportions from a single photograph. It estimates height and weight by identifying skeletal landmarks, calibrating against environmental reference objects, and correcting for camera perspective.
                  </p>
                  <div className="flex gap-6 text-xs text-zinc-600 font-bold uppercase tracking-widest">
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
                      <span className="block text-sm text-zinc-500 group-hover:text-white/60 uppercase tracking-widest font-semibold mt-0.5 transition-colors duration-300">Use Camera</span>
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
                      <span className="block text-sm text-zinc-500 group-hover:text-white/60 uppercase tracking-widest font-semibold mt-0.5 transition-colors duration-300">From Gallery</span>
                    </div>
                  </div>
                  <span className="text-zinc-700 group-hover:text-white/40 font-light text-3xl group-hover:translate-x-1 transition-all duration-300">→</span>
                </button>

                <p className="text-center text-xs text-zinc-600 mt-4 font-semibold tracking-widest uppercase">
                  Local Processing • Privacy Encrypted • v1.1
                </p>

                {/* Compare Mode Link */}
                <button
                  onClick={() => setStep('compare')}
                  className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-brand font-bold uppercase tracking-widest transition-colors py-2"
                >
                  ⚖️ Compare Mode — Track Changes Over Time
                </button>
              </div>
            </div>
          </div>
        );
      case 'compare':
        return <ComparisonMode onBack={handleReset} />;
      case 'capture':
        return <ImageInput onAnalyze={handleImageCaptured} onBack={handleBack} captureMode={captureMode} referenceObject={referenceObject} onReferenceChange={setReferenceObject} />;
      case 'crop':
        return currentImage ? <ImageCropper imageBase64={currentImage} onCrop={handleCropComplete} onSkip={handleSkipCrop} /> : null;
      case 'loading':
        return (
          <div className="w-full animate-fade-in-up py-4 lg:py-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Image with scanning overlay */}
              <div className="relative w-full min-h-[50vh] lg:min-h-[60vh] bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
                {currentImage && (
                  <>
                    <img src={`data:image/jpeg;base64,${currentImage}`} alt="Analyzing" className="w-full h-full object-contain absolute inset-0 opacity-60" />
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-brand/50 to-transparent blur-xl animate-scan"></div>
                  </>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 backdrop-blur-md p-4 rounded-full border border-white/10">
                    <SpinnerIcon className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>

              {/* Right: Skeleton Results + Progress */}
              <div className="flex flex-col justify-center">
                <p className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2">Processing</p>
                <p className="text-base text-zinc-400 font-normal mb-6">
                  Spatial AI is identifying skeletal landmarks to calculate your biometrics.
                </p>

                {/* Skeleton Result Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 animate-pulse">
                    <div className="h-3 w-14 bg-neutral-700 rounded mb-4"></div>
                    <div className="h-10 w-24 bg-neutral-700 rounded-lg mb-2"></div>
                    <div className="h-3 w-16 bg-neutral-800 rounded"></div>
                  </div>
                  <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 animate-pulse" style={{ animationDelay: '150ms' }}>
                    <div className="h-3 w-16 bg-neutral-700 rounded mb-4"></div>
                    <div className="h-10 w-20 bg-neutral-700 rounded-lg mb-2"></div>
                    <div className="h-3 w-14 bg-neutral-800 rounded"></div>
                  </div>
                </div>

                {/* Progress Panel */}
                <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm bg-brand animate-pulse"></div>
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Analysis Steps</span>
                    </div>
                    <span className="text-base font-bold text-brand tabular-nums">{loadingProgress}%</span>
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
                          <span className={`text-sm font-semibold ${i === loadingStepIdx ? 'text-white' : 'text-zinc-500'}`}>{s.label}</span>
                          {i === loadingStepIdx && (
                            <span className="text-xs text-zinc-600 mt-0.5">{s.detail}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'error':
        const guidance = getErrorGuidance(error || '');
        return (
          <div className="w-full animate-fade-in-up py-4 lg:py-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Image Preview */}
              <div className="relative w-full min-h-[40vh] lg:min-h-[50vh] bg-black rounded-2xl overflow-hidden border border-red-500/20">
                {currentImage && (
                  <img src={`data:image/jpeg;base64,${currentImage}`} alt="Failed analysis" className="w-full h-full object-contain absolute inset-0 opacity-40" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500/10 backdrop-blur-md p-5 rounded-full border border-red-500/20">
                    <AlertTriangleIcon className="w-12 h-12 text-red-400" />
                  </div>
                </div>
              </div>

              {/* Right: Error Details */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                  <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Analysis Error</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-4">{guidance.title}</h2>

                <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 mb-6">
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Try the following</p>
                  <div className="space-y-3">
                    {guidance.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 mt-2 bg-brand rounded-full flex-shrink-0"></div>
                        <p className="text-zinc-300 text-base leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRetry}
                    className="flex-1 group bg-brand hover:bg-brand-light text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    <RetryIcon className="w-5 h-5" />
                    Retry Analysis
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 group bg-neutral-900 hover:bg-neutral-800 text-zinc-300 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all border border-neutral-700 active:scale-95"
                  >
                    Start Over
                  </button>
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

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center py-6 lg:py-12 px-4 lg:px-8 overflow-x-hidden selection:bg-brand/30">
      <Confetti active={showConfetti} />
      {/* Theme Toggle — always visible */}
      {/* Theme Toggle — always visible */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Logo — clickable home button, shown on all pages except landing */}
      {step !== 'source' && (
        <div className="w-full max-w-[1400px] mb-6 lg:mb-10">
          <button onClick={handleReset} className="hover:scale-105 active:scale-95 transition-transform" aria-label="Go to home page" title="Home">
            <HeiWeiLogo className="w-9 h-9" />
          </button>
        </div>
      )}


      <main className="w-full max-w-[1400px] flex-1">
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