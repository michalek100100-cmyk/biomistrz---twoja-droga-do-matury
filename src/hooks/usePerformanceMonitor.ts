// src/hooks/usePerformanceMonitor.ts
// Hook for monitoring app performance and triggering emergency refresh

import { useEffect, useRef, useCallback } from 'react';
// import { triggerEmergencyRefresh } from '../services/emergencySaveService';

interface UsePerformanceMonitorProps {
    stats: any;
    quizProgress: any;
    settings: any;
    enabled?: boolean;
}

const FPS_THRESHOLD = 10; // FPS below this is considered critical
const LAG_DURATION_THRESHOLD_MS = 3000; // 3 seconds of lag triggers refresh
const SAMPLE_INTERVAL_MS = 500; // Check FPS every 500ms

export function usePerformanceMonitor({
    stats,
    quizProgress,
    settings,
    enabled = true
}: UsePerformanceMonitorProps): void {
    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const lowFpsStartRef = useRef<number | null>(null);
    const rafIdRef = useRef<number>(0);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Store latest state refs for emergency save
    const statsRef = useRef(stats);
    const quizProgressRef = useRef(quizProgress);
    const settingsRef = useRef(settings);

    // Update refs when props change
    useEffect(() => {
        statsRef.current = stats;
        quizProgressRef.current = quizProgress;
        settingsRef.current = settings;
    }, [stats, quizProgress, settings]);

    const countFrame = useCallback(() => {
        frameCountRef.current++;
        rafIdRef.current = requestAnimationFrame(countFrame);
    }, []);

    const checkPerformance = useCallback(() => {
        const now = performance.now();
        const elapsed = now - lastTimeRef.current;

        if (elapsed > 0) {
            const fps = (frameCountRef.current / elapsed) * 1000;

            if (fps < FPS_THRESHOLD) {
                // FPS is critically low
                if (lowFpsStartRef.current === null) {
                    lowFpsStartRef.current = now;
                    console.warn(`⚠️ Low FPS detected: ${fps.toFixed(1)}`);
                } else {
                    const lagDuration = now - lowFpsStartRef.current;

                    if (lagDuration >= LAG_DURATION_THRESHOLD_MS) {
                        console.warn('🚨 Critical lag detected! (Auto-refresh disabled by user request)');
                        lowFpsStartRef.current = null; // Reset to avoid constant warning
                        return;
                    }
                }
            } else {
                // FPS recovered
                if (lowFpsStartRef.current !== null) {
                    console.log('✅ FPS recovered');
                    lowFpsStartRef.current = null;
                }
            }
        }

        // Reset counters for next sample
        frameCountRef.current = 0;
        lastTimeRef.current = now;
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // 10 second delay for app startup/loading
        const startDelayId = setTimeout(() => {
            // Start counting frames
            rafIdRef.current = requestAnimationFrame(countFrame);

            // Start checking performance at intervals
            checkIntervalRef.current = setInterval(checkPerformance, SAMPLE_INTERVAL_MS);
            console.log("⏱️ Performance monitoring started after 10s delay");
        }, 10000);

        return () => {
            clearTimeout(startDelayId);
            cancelAnimationFrame(rafIdRef.current);
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [enabled, countFrame, checkPerformance]);
}

export default usePerformanceMonitor;
