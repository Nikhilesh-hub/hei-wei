import React, { useState } from 'react';
import { HeiWeiLogo } from './icons';

const SLIDES = [
    {
        icon: '📸',
        title: 'Take a Full-Body Photo',
        description: 'Stand 2-3 meters from the camera. Make sure your entire body from head to toe is visible.',
    },
    {
        icon: '🤖',
        title: 'AI Analyzes Landmarks',
        description: 'Our spatial AI identifies 32 skeletal landmarks and calibrates against environmental cues.',
    },
    {
        icon: '📊',
        title: 'Get Instant Results',
        description: 'See your estimated height and weight in seconds — with confidence scores and unit conversion.',
    },
];

interface OnboardingProps {
    onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(s => s + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in-up">
            <div className="bg-neutral-900 rounded-3xl p-8 lg:p-12 max-w-md w-full mx-4 border border-neutral-800 shadow-2xl">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <HeiWeiLogo className="w-12 h-12" />
                </div>

                {/* Slide Content */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-5">{SLIDES[currentSlide].icon}</div>
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{SLIDES[currentSlide].title}</h3>
                    <p className="text-zinc-400 text-base leading-relaxed">{SLIDES[currentSlide].description}</p>
                </div>

                {/* Dot Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-brand w-6' : 'bg-zinc-600 hover:bg-zinc-500'
                                }`}
                        />
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSkip}
                        className="flex-1 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest py-3 transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 bg-brand hover:bg-brand-light text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95"
                    >
                        {currentSlide < SLIDES.length - 1 ? 'Next' : 'Get Started'}
                    </button>
                </div>
            </div>
        </div>
    );
};
