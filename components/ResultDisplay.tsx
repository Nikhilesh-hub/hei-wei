import React from 'react';
import type { AnalysisResult } from '../types';
import type { UnitSystem } from '../App';
import { RefreshIcon, InfoIcon } from './icons';

interface ResultDisplayProps {
  result: AnalysisResult;
  image: string | null;
  onReset: () => void;
  unitSystem: UnitSystem;
  onUnitChange: (system: UnitSystem) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, image, onReset, unitSystem, onUnitChange }) => {
  const { heightCm, weightKg, accuracy } = result;
  
  // improved imperial calculation
  const totalInches = Math.round(heightCm / 2.54);
  const heightFeet = Math.floor(totalInches / 12);
  const heightInches = totalInches % 12;
  
  const weightLbs = (weightKg * 2.20462).toFixed(1);
  
  const hMain = unitSystem === 'imperial' ? `${heightFeet}'${heightInches}"` : `${heightCm.toFixed(0)} cm`;
  const hSub = unitSystem === 'imperial' ? `${heightCm.toFixed(0)} cm` : `${heightFeet}'${heightInches}"`;
  
  const wMain = unitSystem === 'imperial' ? `${weightLbs} lb` : `${weightKg.toFixed(1)} kg`;
  const wSub = unitSystem === 'imperial' ? `${weightKg.toFixed(1)} kg` : `${weightLbs} lb`;

  return (
    <div className="animate-fade-in-up w-full h-full flex flex-col lg:flex-row gap-8 lg:gap-16">
        
        {/* Left Col: Image */}
        <div className="w-full lg:w-5/12 flex-shrink-0">
             <div className="relative w-full aspect-[3/4] lg:aspect-[4/5] bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl sticky top-8 mx-auto max-w-md lg:max-w-none">
                 {image && (
                     <img src={`data:image/jpeg;base64,${image}`} alt="Analyzed Subject" className="w-full h-full object-cover" />
                 )}
                 <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${
                        accuracy === 'high' ? 'bg-green-500/20 text-green-300 border-green-500/20' : 
                        accuracy === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20' : 
                        'bg-orange-500/20 text-orange-300 border-orange-500/20'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                             accuracy === 'high' ? 'bg-green-400' : 
                             accuracy === 'medium' ? 'bg-yellow-400' : 'bg-orange-400'
                        }`}></span>
                        {accuracy} Confidence
                      </span>
                 </div>
             </div>
        </div>

        {/* Right Col: Stats & Controls */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 lg:mb-12 gap-6">
                <h2 className="text-4xl font-bold text-white tracking-tight">Analysis Results</h2>
                <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5">
                    <button
                        onClick={() => onUnitChange('metric')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all ${unitSystem === 'metric' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Metric
                    </button>
                    <button
                        onClick={() => onUnitChange('imperial')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all ${unitSystem === 'imperial' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Imperial
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
                {/* Height Card */}
                <div className="bg-zinc-900/30 rounded-[2.5rem] p-8 lg:p-10 border border-white/5 relative overflow-hidden group hover:bg-zinc-900/50 transition-colors">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-8xl font-bold text-white">H</span>
                    </div>
                    <p className="text-xs font-bold text-brand uppercase tracking-[0.4em] mb-4">Height</p>
                    <p className="text-6xl lg:text-7xl leading-none font-bold text-white tracking-tightest mb-4">{hMain}</p>
                    <p className="text-lg font-medium text-zinc-500">{hSub}</p>
                </div>

                {/* Weight Card */}
                <div className="bg-zinc-900/30 rounded-[2.5rem] p-8 lg:p-10 border border-white/5 relative overflow-hidden group hover:bg-zinc-900/50 transition-colors">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-8xl font-bold text-white">W</span>
                    </div>
                    <p className="text-xs font-bold text-brand uppercase tracking-[0.4em] mb-4">Weight</p>
                    <p className="text-6xl lg:text-7xl leading-none font-bold text-white tracking-tightest mb-4">{wMain}</p>
                    <p className="text-lg font-medium text-zinc-500">{wSub}</p>
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
                <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-[1.5rem] flex items-center gap-4">
                    <InfoIcon className="w-5 h-5 text-zinc-500 ml-2" />
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        These estimates are generated by AI based on visual markers and should not be considered medical data. Lighting, clothing, and camera angle affect precision.
                    </p>
                </div>

                <button
                    onClick={onReset}
                    className="w-full flex items-center justify-center gap-3 bg-white text-zinc-950 font-bold py-6 px-8 rounded-[1.5rem] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl text-lg mt-4"
                >
                    <RefreshIcon className="w-5 h-5" />
                    Analyze New Photo
                </button>
            </div>
        </div>
    </div>
  );
};