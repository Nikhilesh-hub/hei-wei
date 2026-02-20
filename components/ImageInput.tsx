import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon, ArrowLeftIcon, CameraIcon, SlashIcon, DoorIcon, BoltIcon, BoxIcon, BodyScanIcon } from './icons';
import { resizeImage } from '../utils/imageUtils';

interface ImageInputProps {
    onAnalyze: (base64Image: string) => void;
    onBack: () => void;
    captureMode: 'camera' | 'upload';
    referenceObject?: string;
    onReferenceChange?: (ref: string) => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ onAnalyze, onBack, captureMode, referenceObject = 'none', onReferenceChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const base64 = await resizeImage(file);
                onAnalyze(base64);
            } catch (error) {
                console.error("Image processing error:", error);
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

    const isCamera = captureMode === 'camera';

    return (
        <div className="w-full flex flex-col animate-fade-in-up h-full justify-center">
            <div className="w-full flex justify-between items-center mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 px-4 py-2.5 rounded-xl border border-neutral-700"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-lg font-bold uppercase tracking-widest">Back</span>
                </button>
                <span className="text-base font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">
                    {isCamera ? 'Take Photo' : 'Import Image'}
                </span>
                <div className="w-20 hidden sm:block"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left: Action Area */}
                <div
                    className={`w-full min-h-[400px] lg:h-[500px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 p-10 lg:p-12 ${isDragging ? 'border-brand bg-brand/5' : 'border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-500'}`}
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
                    <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 border border-neutral-700">
                        {isCamera ? <CameraIcon className="w-7 h-7 text-brand" /> : <UploadIcon className="w-7 h-7 text-brand" />}
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">
                        {isCamera ? 'Tap to Capture' : 'Upload Photo'}
                    </h3>
                    <p className="text-zinc-400 mb-6 text-center max-w-xs text-xl font-medium opacity-90">
                        {isCamera ? 'Opens your device camera' : <><span>Drag & drop an image or </span><br /><span>paste from clipboard </span><span className="text-brand font-bold bg-brand/10 px-2 py-0.5 rounded text-base">Ctrl+V</span></>}
                    </p>
                    <p className="text-base text-zinc-600 font-bold uppercase tracking-widest bg-neutral-800 px-4 py-2 rounded-full border border-neutral-700">JPG • PNG • HEIC</p>

                    <input
                        type="file"
                        accept="image/*"
                        // @ts-ignore: React 19 types might be strict about this string attribute
                        capture={isCamera ? "environment" : undefined}
                        ref={fileInputRef}
                        onChange={(e) => { void handleFileSelect(e.target.files?.[0] ?? null); }}
                        className="hidden"
                    />
                </div>

                {/* Right: Info Panel */}
                <div className="bg-neutral-900 rounded-2xl p-8 lg:p-10 border border-neutral-800 flex flex-col justify-center">
                    <h4 className="text-3xl font-black text-white mb-8 tracking-tight">Best Practices</h4>
                    <div className="space-y-5">
                        {[
                            { label: "Reference", text: "Stand near a door frame or standard object for scale." },
                            { label: "Lighting", text: "Use bright, even lighting to show body definition." },
                            { label: "Distance", text: "Ensure full body (head to toe) is clearly visible." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-2.5 h-2.5 mt-1.5 bg-brand rounded-sm flex-shrink-0"></div>
                                <div>
                                    <p className="text-white font-bold text-xl mb-1">{item.label}</p>
                                    <p className="text-zinc-500 text-lg leading-relaxed font-medium">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reference Object Hint */}
                <div className="mt-6 bg-neutral-900 rounded-2xl p-6 lg:p-8 border border-neutral-800">
                    <h4 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                        <BodyScanIcon className="w-8 h-8 text-brand" />
                        Improve Accuracy
                    </h4>
                    <p className="text-lg text-zinc-500 mb-6 font-medium">Standing near a known object? Let us know for better results.</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'none', label: 'No reference', icon: <SlashIcon className="w-5 h-5" /> },
                            { id: 'door_frame', label: 'Door frame', icon: <DoorIcon className="w-5 h-5" /> },
                            { id: 'light_switch', label: 'Light switch', icon: <BoltIcon className="w-5 h-5" /> },
                            { id: 'refrigerator', label: 'Refrigerator', icon: <BoxIcon className="w-5 h-5" /> },
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => onReferenceChange?.(opt.id)}
                                className={`px-4 py-2.5 rounded-xl text-base font-bold transition-all border ${referenceObject === opt.id
                                    ? 'bg-brand/20 text-brand border-brand/40'
                                    : 'bg-neutral-800 text-zinc-400 border-neutral-700 hover:border-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};