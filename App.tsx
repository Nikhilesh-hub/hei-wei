import React, { useState, useCallback } from 'react';
import { ImageInput } from './components/ImageInput';
import { ResultDisplay } from './components/ResultDisplay';
import { CameraInput } from './components/CameraInput';
import { analyzeImageForMetrics } from './services/geminiService';
import type { AnalysisResult } from './types';
import { LogoIcon, CameraIcon, UploadIcon, SpinnerIcon, CheckIcon } from './components/icons';

type Step = 'source' | 'capture' | 'loading' | 'result';
type CaptureMode = 'upload' | 'camera';
export type UnitSystem = 'metric' | 'imperial';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('source');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [currentImage, setCurrentImage] = useState<string | null>(null);

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
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center animate-fade-in-up py-6 lg:py-0">
            {/* Left Column: Branding & Info */}
            <div className="flex flex-col text-center lg:text-left">
              <div className="mb-10 flex justify-center lg:justify-start">
                <div className="p-4 bg-white/5 rounded-3xl border border-white/10 inline-block shadow-2xl">
                  <LogoIcon className="w-12 h-12 text-brand" />
                </div>
              </div>
              <h2 className="text-5xl xl:text-7xl font-bold text-white mb-6 tracking-tighter leading-[0.9]">
                Hei<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-500">wei.</span>
              </h2>
              <p className="text-zinc-400 text-lg lg:text-xl font-light mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Instant body metrics from a single photo.
              </p>

              <div className="bg-zinc-900/60 rounded-[2.5rem] p-10 border border-white/5 text-left backdrop-blur-md shadow-inner">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-brand rounded-full animate-pulse"></div>
                  <p className="text-xs font-bold text-brand uppercase tracking-[0.2em]">Technology</p>
                </div>
                <p className="text-zinc-300 leading-relaxed font-light text-lg">
                  Hei-wei uses AI to analyze your body proportions and provide accurate estimates in seconds.
                </p>
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="flex flex-col gap-4 w-full">
              <div className="p-1.5 rounded-[2.5rem] bg-gradient-to-br from-white/10 via-brand/20 to-transparent">
                <button
                  onClick={() => { setCaptureMode('camera'); setStep('capture'); }}
                  className="w-full group bg-zinc-950 p-6 rounded-[2.2rem] flex items-center justify-between hover:bg-zinc-900 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-brand/20">
                      <CameraIcon className="w-6 h-6 text-brand" />
                    </div>
                    <div className="text-left">
                      <span className="block text-2xl font-bold text-white group-hover:text-brand transition-colors mb-0.5">Capture Image</span>
                      <span className="block text-xs text-zinc-500 uppercase tracking-widest font-medium">Use Camera</span>
                    </div>
                  </div>
                  <span className="text-zinc-800 font-light text-4xl group-hover:translate-x-2 transition-transform relative z-10">→</span>
                </button>
              </div>

              <button
                onClick={() => { setCaptureMode('upload'); setStep('capture'); }}
                className="w-full group bg-white/[0.03] p-6 rounded-[2.5rem] flex items-center justify-between hover:bg-white/[0.06] transition-all duration-300 border border-white/5"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <UploadIcon className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="text-left">
                    <span className="block text-2xl font-bold text-white">Upload Photo</span>
                    <span className="block text-xs text-zinc-500 uppercase tracking-widest font-medium">From Gallery</span>
                  </div>
                </div>
                <span className="text-zinc-700 font-light text-4xl group-hover:translate-x-2 transition-transform">→</span>
              </button>

              <p className="text-center text-xs text-zinc-600 mt-6 font-medium tracking-widest uppercase opacity-60">
                Local Processing • Privacy Encrypted
              </p>
            </div>
          </div>
        );
      case 'capture':
        return captureMode === 'upload'
          ? <ImageInput onAnalyze={handleAnalysis} onBack={handleBack} />
          : <CameraInput onAnalyze={handleAnalysis} onBack={handleBack} />;
      case 'loading':
        return (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fade-in-up py-10 lg:py-0">
            {/* Image Preview with Scanning Effect */}
            <div className="relative w-full aspect-[3/4] lg:aspect-[4/5] bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl mx-auto max-w-md lg:max-w-none">
              {currentImage && (
                <>
                  <img src={`data:image/jpeg;base64,${currentImage}`} alt="Analyzing" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-brand/50 to-transparent blur-xl animate-scan"></div>
                </>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-full border border-white/10">
                  <SpinnerIcon className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            {/* Loading Text */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <p className="text-5xl lg:text-7xl font-bold text-white tracking-tight">Processing</p>
                <p className="text-xl text-zinc-400 font-light max-w-md">
                  Our spatial AI is identifying 32 skeletal landmarks to calculate your biometrics.
                </p>
              </div>

              <div className="w-full max-w-sm bg-zinc-900/50 rounded-2xl p-6 border border-white/5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Analysis Steps</span>
                </div>
                <div className="space-y-3">
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand w-2/3 animate-pulse"></div>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400 font-medium">
                    <span>Geometric Scaling</span>
                    <span>72%</span>
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
      <main className="w-full max-w-[1400px]">
        {error && (step === 'source') && (
          <div className="mb-8 p-6 bg-red-500/5 border border-red-500/10 text-red-400 rounded-[2rem] flex items-center justify-center gap-3 animate-fade-in-up shadow-lg shadow-red-500/5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
          </div>
        )}

        {/* Main Content Card - Responsive Padding and Layout */}
        <div className={`
            glass rounded-[3rem] relative overflow-hidden transition-all duration-700
            ${step === 'source' ? 'p-8 lg:p-16' : 'p-6 lg:p-12'}
        `}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;