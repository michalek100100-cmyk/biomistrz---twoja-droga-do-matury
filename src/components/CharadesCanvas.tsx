import React, { useRef, useEffect, useState } from 'react';
import { ref, onChildAdded, push, onValue, off } from 'firebase/database';
import { rtdb } from './firebaseConfig';
import { DrawingPoint } from '../types';

interface CharadesCanvasProps {
    gameId: string;
    isDrawer: boolean;
    color?: string;
    lineWidth?: number;
}

const CharadesCanvas: React.FC<CharadesCanvasProps> = ({
    gameId,
    isDrawer,
    color = '#ffffff',
    lineWidth = 3
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const drawingRef = ref(rtdb, `games/charades/${gameId}/drawing`);

    // --- LOGIKA RYSOWNIKA ---
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawer) return;
        setIsDrawing(true);
        draw(e, 'start');
    };

    const stopDrawing = () => {
        if (!isDrawer) return;
        setIsDrawing(false);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // Normalizacja do 1000x1000 dla spójności między urządzeniami
        return {
            x: ((clientX - rect.left) / rect.width) * 1000,
            y: ((clientY - rect.top) / rect.height) * 1000
        };
    };

    const draw = (e: React.MouseEvent | React.TouchEvent, type: 'start' | 'draw' = 'draw') => {
        if (!isDrawing && type === 'draw') return;
        if (!isDrawer) return;

        const { x, y } = getCoordinates(e);

        // Wyślij punkt do RTDB
        push(drawingRef, {
            x,
            y,
            type,
            color,
            width: lineWidth
        });
    };

    // --- LOGIKA RENDERINGU (Dla obu ról) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dopasuj canvas do kontenera
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };

        resize();
        window.addEventListener('resize', resize);

        // Funkcja rysująca punkt
        const drawPointOnCanvas = (point: DrawingPoint, prevPoint?: DrawingPoint) => {
            const rect = canvas.getBoundingClientRect();
            const realX = (point.x / 1000) * rect.width;
            const realY = (point.y / 1000) * rect.height;

            ctx.strokeStyle = point.color || '#ffffff';
            ctx.lineWidth = point.width || 3;

            if (point.type === 'start' || !prevPoint) {
                ctx.beginPath();
                ctx.moveTo(realX, realY);
            } else {
                const prevX = (prevPoint.x / 1000) * rect.width;
                const prevY = (prevPoint.y / 1000) * rect.height;
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(realX, realY);
                ctx.stroke();
            }
        };

        // Nasłuchiwanie na nowe punkty z RTDB
        let lastPoint: DrawingPoint | undefined;
        const unsub = onChildAdded(drawingRef, (snapshot) => {
            const point = snapshot.val() as DrawingPoint;
            drawPointOnCanvas(point, lastPoint);
            lastPoint = point;
        });

        // Nasłuchiwanie na wyczyszczenie (usunięcie wszystkich punktów)
        const unsubClear = onValue(drawingRef, (snapshot) => {
            if (!snapshot.exists()) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                lastPoint = undefined;
            }
        });

        return () => {
            window.removeEventListener('resize', resize);
            off(drawingRef);
            unsub();
            unsubClear();
        };
    }, [gameId]); // Re-run when gameId changes

    return (
        <div className="w-full aspect-square bg-white/5 rounded-3xl border-2 border-white/10 overflow-hidden relative cursor-crosshair backdrop-blur-sm">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={(e) => draw(e)}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={(e) => draw(e)}
                onTouchEnd={stopDrawing}
                className="w-full h-full touch-none"
            />
        </div>
    );
};

export default CharadesCanvas;
