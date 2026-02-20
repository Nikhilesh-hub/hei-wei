import React, { useState } from 'react';
import { ThumbsUpIcon, ThumbsDownIcon, CheckIcon } from './icons';

interface FeedbackProps {
    sessionId?: string;
}

export const Feedback: React.FC<FeedbackProps> = ({ sessionId }) => {
    const [vote, setVote] = useState<'up' | 'down' | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleVote = (type: 'up' | 'down') => {
        setVote(type);
        setSubmitted(true);
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
            <div className="flex items-center gap-2 mt-6 p-3 bg-brand/10 rounded-xl border border-brand/20 animate-fade-in text-brand justify-center">
                <CheckIcon className="w-5 h-5" />
                <span className="text-base font-semibold">Thanks for your feedback!</span>
            </div>
        );
    }

    return (
        <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col items-center gap-4 animate-fade-in">
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Was this result accurate?</p>
            <div className="flex gap-4">
                <button
                    onClick={() => handleVote('up')}
                    className="p-3 rounded-xl bg-neutral-900 hover:bg-brand/15 hover:text-brand text-zinc-400 transition-all border border-neutral-800 hover:border-brand/40 hover:scale-110 active:scale-95"
                    aria-label="Thumbs Up"
                >
                    <ThumbsUpIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={() => handleVote('down')}
                    className="p-3 rounded-xl bg-neutral-900 hover:bg-red-500/15 hover:text-red-400 text-zinc-400 transition-all border border-neutral-800 hover:border-red-500/40 hover:scale-110 active:scale-95"
                    aria-label="Thumbs Down"
                >
                    <ThumbsDownIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
