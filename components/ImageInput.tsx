import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon, ArrowLeftIcon, CameraIcon } from './icons';
import { resizeImage } from '../utils/imageUtils';

interface ImageInputProps {
    onAnalyze: (base64Image: string) => void;
    onBack: () => void;
    captureMode: 'camera' | 'upload';
}

export const ImageInput: React.FC<ImageInputProps> = ({ onAnalyze, onBack, captureMode }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const base64 = await resizeImage(file);
                onAnalyze(base64);
            } catch (error) {
                console.error("Image processing error:", error);
                // Fallback to original if resize fails (unlikely)
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = (e.target?.result as string)?.split(',')[1];
                    if (base64) onAnalyze(base64);
                };
                reader.readAsDataURL(file);
            }
        }
    }, [onAnalyze]);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                const file = e.clipboardData.files[0];
                handleFileSelect(file);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleFileSelect]);

    // Automatically trigger click on mount if in camera mode on mobile often helps, 
    // but here we let the user click the big area to be safe and avoid popup blockers.

    const isCamera = captureMode === 'camera';

    return (
        <div className="w-full flex flex-col animate-slide-up h-full justify-center">
            <div className="w-full flex justify-between items-center mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                </button>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">
                    {isCamera ? 'Take Photo' : 'Import Image'}
                </span>
                <div className="w-20 hidden sm:block"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left: Action Area */}
                <div
                    className={`w-full aspect-[4/3] lg:aspect-auto lg:h-[500px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-brand bg-brand/5' : 'border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-zinc-500'}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFileSelect(e.dataTransfer.files?.[0] ?? null);
                    }}
                >
                    <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                        {isCamera ? <CameraIcon className="w-8 h-8 text-brand" /> : <UploadIcon className="w-8 h-8 text-brand" />}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {isCamera ? 'Tap to Capture' : 'Upload Photo'}
                    </h3>
                    <p className="text-zinc-400 mb-6 text-center max-w-xs">
                        {isCamera ? 'Opens your device camera' : <>Drag & drop an image or <br /> paste from clipboard <span className="text-brand font-bold bg-brand/10 px-2 py-0.5 rounded text-xs">Ctrl+V</span></>}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full">JPG • PNG • HEIC</p>

                    <input
                        type="file"
                        accept="image/*"
                        capture={isCamera ? "environment" : undefined}
                        ref={fileInputRef}
                        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                        className="hidden"
                    />
                </div>

                {/* Right: Info Panel */}
                <div className="bg-zinc-900/50 rounded-[2.5rem] p-8 lg:p-12 border border-white/5 flex flex-col justify-center">
                    <h4 className="text-xl font-bold text-white mb-6">Best Practices</h4>
                    <div className="space-y-6">
                        {[
                            { label: "Lighting", text: "Use bright, even lighting from the front." },
                            { label: "Distance", text: "Ensure the full body is visible in the frame." },
                            { label: "Angle", text: "Phone at chest height, facing straight." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-1.5 h-1.5 mt-2 bg-zinc-600 rounded-full"></div>
                                <div>
                                    <p className="text-zinc-300 font-bold text-sm mb-1">{item.label}</p>
                                    <p className="text-zinc-500 text-sm leading-relaxed">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};