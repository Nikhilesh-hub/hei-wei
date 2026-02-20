import React, { useState, useRef, useCallback, useEffect } from 'react';

type DragType = 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';

interface ImageCropperProps {
    imageBase64: string;
    onCrop: (croppedBase64: string) => void;
    onSkip: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageBase64, onCrop, onSkip }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<DragType | null>(null);
    const [cropRect, setCropRect] = useState({ x: 0.1, y: 0.05, w: 0.8, h: 0.9 });
    const startRef = useRef({ mx: 0, my: 0, rect: { x: 0, y: 0, w: 0, h: 0 } });
    const MIN = 0.15;

    const getContainerRect = useCallback(() => {
        return containerRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 1, height: 1 };
    }, []);

    const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent, type: DragType) => {
        e.preventDefault();
        const pos = 'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
        setIsDragging(true);
        setDragType(type);
        startRef.current = { mx: pos.x, my: pos.y, rect: { ...cropRect } };
    }, [cropRect]);

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging || !dragType) return;
            const pos = 'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
            const cr = getContainerRect();
            const dx = (pos.x - startRef.current.mx) / cr.width;
            const dy = (pos.y - startRef.current.my) / cr.height;
            const s = startRef.current.rect;

            if (dragType === 'move') {
                setCropRect({
                    x: Math.max(0, Math.min(1 - s.w, s.x + dx)),
                    y: Math.max(0, Math.min(1 - s.h, s.y + dy)),
                    w: s.w,
                    h: s.h,
                });
            } else if (dragType === 'resize-br') {
                setCropRect({
                    x: s.x,
                    y: s.y,
                    w: Math.max(MIN, Math.min(1 - s.x, s.w + dx)),
                    h: Math.max(MIN, Math.min(1 - s.y, s.h + dy)),
                });
            } else if (dragType === 'resize-tl') {
                const newW = Math.max(MIN, Math.min(s.x + s.w, s.w - dx));
                const newH = Math.max(MIN, Math.min(s.y + s.h, s.h - dy));
                setCropRect({
                    x: s.x + s.w - newW,
                    y: s.y + s.h - newH,
                    w: newW,
                    h: newH,
                });
            } else if (dragType === 'resize-tr') {
                const newW = Math.max(MIN, Math.min(1 - s.x, s.w + dx));
                const newH = Math.max(MIN, Math.min(s.y + s.h, s.h - dy));
                setCropRect({
                    x: s.x,
                    y: s.y + s.h - newH,
                    w: newW,
                    h: newH,
                });
            } else if (dragType === 'resize-bl') {
                const newW = Math.max(MIN, Math.min(s.x + s.w, s.w - dx));
                const newH = Math.max(MIN, Math.min(1 - s.y, s.h + dy));
                setCropRect({
                    x: s.x + s.w - newW,
                    y: s.y,
                    w: newW,
                    h: newH,
                });
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
            setDragType(null);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, dragType, getContainerRect]);

    const handleCrop = useCallback(() => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const sx = Math.round(cropRect.x * img.width);
            const sy = Math.round(cropRect.y * img.height);
            const sw = Math.round(cropRect.w * img.width);
            const sh = Math.round(cropRect.h * img.height);
            canvas.width = sw;
            canvas.height = sh;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
            onCrop(base64);
        };
        img.src = `data:image/jpeg;base64,${imageBase64}`;
    }, [cropRect, imageBase64, onCrop]);

    const cornerHandle = (corner: DragType, pos: string, cursor: string) => (
        <div
            className={`absolute ${pos} w-6 h-6 bg-brand rounded-full ${cursor} border-2 border-white shadow-lg z-10 hover:scale-125 transition-transform`}
            onMouseDown={(e) => { e.stopPropagation(); handleStart(e, corner); }}
            onTouchStart={(e) => { e.stopPropagation(); handleStart(e, corner); }}
        />
    );

    return (
        <div className="w-full animate-fade-in-up py-4 lg:py-0">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Crop Image</h2>
                    <p className="text-xl text-zinc-400 mt-2 font-medium">Drag to position, resize from any corner</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onSkip}
                        className="bg-neutral-900 hover:bg-neutral-800 text-zinc-300 px-5 py-2.5 rounded-xl font-bold text-base uppercase tracking-widest border border-neutral-700 transition-all active:scale-95"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleCrop}
                        className="bg-brand hover:bg-brand-light text-white px-5 py-2.5 rounded-xl font-bold text-base uppercase tracking-widest transition-all active:scale-95"
                    >
                        Crop & Analyze
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="relative w-full aspect-[3/4] max-h-[70vh] bg-black rounded-2xl overflow-hidden border border-neutral-800 select-none"
            >
                <img
                    ref={imgRef}
                    src={`data:image/jpeg;base64,${imageBase64}`}
                    alt="Crop preview"
                    className="w-full h-full object-contain"
                    draggable={false}
                />
                {/* Dark overlay outside crop */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: `linear-gradient(to right,
                        rgba(0,0,0,0.6) ${cropRect.x * 100}%,
                        transparent ${cropRect.x * 100}%,
                        transparent ${(cropRect.x + cropRect.w) * 100}%,
                        rgba(0,0,0,0.6) ${(cropRect.x + cropRect.w) * 100}%)`
                }} />
                {/* Top/bottom dark overlay */}
                <div className="absolute pointer-events-none" style={{
                    left: `${cropRect.x * 100}%`,
                    width: `${cropRect.w * 100}%`,
                    top: 0,
                    height: `${cropRect.y * 100}%`,
                    background: 'rgba(0,0,0,0.6)',
                }} />
                <div className="absolute pointer-events-none" style={{
                    left: `${cropRect.x * 100}%`,
                    width: `${cropRect.w * 100}%`,
                    top: `${(cropRect.y + cropRect.h) * 100}%`,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                }} />

                {/* Crop rectangle */}
                <div
                    className="absolute border-2 border-brand cursor-move"
                    style={{
                        left: `${cropRect.x * 100}%`,
                        top: `${cropRect.y * 100}%`,
                        width: `${cropRect.w * 100}%`,
                        height: `${cropRect.h * 100}%`,
                    }}
                    onMouseDown={(e) => handleStart(e, 'move')}
                    onTouchStart={(e) => handleStart(e, 'move')}
                >
                    {/* Interactive corner resize handles — all four corners */}
                    {cornerHandle('resize-tl', '-top-3 -left-3', 'cursor-nw-resize')}
                    {cornerHandle('resize-tr', '-top-3 -right-3', 'cursor-ne-resize')}
                    {cornerHandle('resize-bl', '-bottom-3 -left-3', 'cursor-sw-resize')}
                    {cornerHandle('resize-br', '-bottom-3 -right-3', 'cursor-se-resize')}
                    {/* Corner bracket markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                </div>
            </div>
        </div>
    );
};
