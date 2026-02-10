import React from 'react';
import { ArrowLeftIcon, CheckIcon } from './icons';

interface InstructionsDisplayProps {
    method: 'environment';
    onBack?: () => void;
    onContinue: () => void;
}

const points = [
    "Hold camera at chest height",
    "Keep phone perfectly vertical",
    "Visible from head to toes",
    "Stand straight and still"
];

export const InstructionsDisplay: React.FC<InstructionsDisplayProps> = ({ onBack, onContinue }) => {
    return (
        <div className="w-full flex flex-col items-center animate-slide-up">
            <div className="w-full flex justify-between items-center mb-8">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-900 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Setup</span>
                <div className="w-5"></div>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Camera Tips</h2>
            
            <ul className="w-full space-y-3 mb-10">
                {points.map((point, index) => (
                    <li key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex-shrink-0 w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-3 h-3 text-brand" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{point}</span>
                    </li>
                ))}
            </ul>
            
            <button
                onClick={onContinue}
                className="w-full bg-brand text-white font-bold py-4 px-8 rounded-2xl hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-brand/20"
            >
                Start Camera
            </button>
        </div>
    );
};