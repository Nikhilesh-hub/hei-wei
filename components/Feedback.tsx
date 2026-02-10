import React, { useState, useEffect } from 'react';
import { ThumbsUpIcon, ThumbsDownIcon, CheckIcon } from './icons';

interface FeedbackProps {
    sessionId?: string; // Optional ID to track specific analyses
}

export const Feedback: React.FC<FeedbackProps> = ({ sessionId }) => {
    const [vote, setVote] = useState<'up' | 'down' | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleVote = (type: 'up' | 'down') => {
        setVote(type);
        setSubmitted(true);

        // In a real app, send to API here.
        // For now, we just log to console and local storage.
        console.log(`User feedback: ${type}`);
        try {
            const history = JSON.parse(localStorage.getItem('heiwei_feedback') || '[]');
            history.push({ timestamp: Date.now(), type, sessionId });
            localStorage.setItem('heiwei_feedback', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save feedback", e);
        }
    };

    if (submitted) {
        return (
            <div className="flex items-center gap-2 mt-6 p-3 bg-green-500/10 rounded-xl border border-green-500/20 animate-fade-in text-green-400 justify-center">
                <CheckIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Thanks for your feedback!</span>
            </div>
        );
    }

    return (
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4 animate-fade-in">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Was this result accurate?</p>
            <div className="flex gap-4">
                <button
                    onClick={() => handleVote('up')}
                    className="p-3 rounded-full bg-zinc-800 hover:bg-green-500/20 hover:text-green-400 text-zinc-400 transition-all border border-white/5 hover:border-green-500/50 hover:scale-110 active:scale-95"
                    aria-label="Thumbs Up"
                >
                    <ThumbsUpIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={() => handleVote('down')}
                    className="p-3 rounded-full bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-all border border-white/5 hover:border-red-500/50 hover:scale-110 active:scale-95"
                    aria-label="Thumbs Down"
                >
                    <ThumbsDownIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
