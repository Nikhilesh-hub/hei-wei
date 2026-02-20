import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
    active: boolean;
}

const COLORS = ['#00A562', '#00C876', '#34D399', '#6EE7B7', '#ffffff', '#A7F3D0'];
const PARTICLE_COUNT = 60;

export const Confetti: React.FC<ConfettiProps> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        if (!active || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        interface Particle {
            x: number; y: number; vx: number; vy: number;
            w: number; h: number; color: string;
            rotation: number; spin: number; opacity: number;
        }

        const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.6,
            y: canvas.height * 0.3 + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 8,
            vy: -(Math.random() * 6 + 4),
            w: Math.random() * 8 + 4,
            h: Math.random() * 6 + 3,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.3,
            opacity: 1,
        }));

        let frame = 0;
        const maxFrames = 120;

        const animate = () => {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.vx;
                p.vy += 0.15; // gravity
                p.y += p.vy;
                p.rotation += p.spin;
                p.opacity = Math.max(0, 1 - frame / maxFrames);

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            if (frame < maxFrames) {
                animRef.current = requestAnimationFrame(animate);
            }
        };

        animRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animRef.current);
        };
    }, [active]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
};
