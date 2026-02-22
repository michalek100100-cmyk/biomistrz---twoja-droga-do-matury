// src/hooks/usePomodoroTimer.ts
// Lifted Pomodoro state – persists across tab navigation
import { useState, useEffect, useRef, useCallback } from 'react';

export type PomodoroPhase = 'idle' | 'work' | 'break' | 'longBreak';

export interface PomodoroState {
    phase: PomodoroPhase;
    running: boolean;
    secondsLeft: number;
    totalSeconds: number;
    sessions: number;
    workMin: number;
    breakMin: number;
    longBreakMin: number;
}

export interface PomodoroControls {
    start: () => void;
    pause: () => void;
    reset: () => void;
    skip: () => void;
    setWorkMin: (v: number | ((prev: number) => number)) => void;
    setBreakMin: (v: number | ((prev: number) => number)) => void;
    setLongBreakMin: (v: number | ((prev: number) => number)) => void;
}

// ── Bell tone via Web Audio API ──────────────────────────────────────────────
export const playBell = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const t = ctx.currentTime;

        const makeOsc = (freq: number, startAt: number, duration: number, volume: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, t + startAt);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.75, t + startAt + duration);
            gain.gain.setValueAtTime(0, t + startAt);
            gain.gain.setValueAtTime(volume, t + startAt + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + startAt + duration);
            osc.start(t + startAt);
            osc.stop(t + startAt + duration);
        };

        makeOsc(880, 0, 1.0, 0.5);
        makeOsc(1100, 0.3, 0.9, 0.4);
        makeOsc(660, 0.6, 1.0, 0.35);
    } catch (e) {
        console.warn('Web Audio not available', e);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
export function usePomodoroTimer(): [PomodoroState, PomodoroControls] {
    const [workMin, setWorkMin] = useState(25);
    const [breakMin, setBreakMin] = useState(5);
    const [longBreakMin, setLongBreakMin] = useState(15);

    const [phase, setPhase] = useState<PomodoroPhase>('idle');
    const [running, setRunning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(25 * 60);
    const [totalSeconds, setTotalSeconds] = useState(25 * 60);
    const [sessions, setSessions] = useState(0);

    // Timestamp-based approach: remember when the current "tick period" started
    // and how many seconds were left at that point. This way the timer stays
    // accurate even when the browser throttles setInterval in background tabs.
    const tickStartRef = useRef<number | null>(null);   // Date.now() when running started
    const secondsAtStartRef = useRef<number>(0);        // secondsLeft at that moment
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Advance to the next phase when the timer hits 0
    const advancePhase = useCallback(
        (currentPhase: PomodoroPhase, currentSessions: number) => {
            playBell();
            if (currentPhase === 'work') {
                const newSessions = currentSessions + 1;
                setSessions(newSessions);
                const nextPhase: PomodoroPhase =
                    newSessions % 4 === 0 ? 'longBreak' : 'break';
                const dur =
                    nextPhase === 'longBreak' ? longBreakMin * 60 : breakMin * 60;
                setPhase(nextPhase);
                setSecondsLeft(dur);
                setTotalSeconds(dur);
                setRunning(true);
            } else {
                const dur = workMin * 60;
                setPhase('work');
                setSecondsLeft(dur);
                setTotalSeconds(dur);
                setRunning(true);
            }
        },
        [workMin, breakMin, longBreakMin]
    );

    // Compute the real remaining seconds based on elapsed wall-clock time
    const computeSecondsLeft = useCallback((): number => {
        if (tickStartRef.current === null) return secondsAtStartRef.current;
        const elapsed = Math.floor((Date.now() - tickStartRef.current) / 1000);
        return Math.max(0, secondsAtStartRef.current - elapsed);
    }, []);

    // Main tick effect: timestamp-based so background throttling doesn't matter
    useEffect(() => {
        if (!running) {
            // Snapshot current secondsLeft so we can resume from correct position
            secondsAtStartRef.current = secondsLeft;
            tickStartRef.current = null;
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        // Record the wall-clock start moment
        tickStartRef.current = Date.now();
        secondsAtStartRef.current = secondsLeft;

        intervalRef.current = setInterval(() => {
            const real = computeSecondsLeft();
            setSecondsLeft(real);
            if (real <= 0) {
                clearInterval(intervalRef.current!);
                setRunning(false);
            }
        }, 500); // poll frequently so the display updates smoothly

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running]);

    // When tab becomes visible again, recalculate immediately
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && running) {
                const real = computeSecondsLeft();
                setSecondsLeft(real);
                if (real <= 0) {
                    setRunning(false);
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [running, computeSecondsLeft]);

    // When secondsLeft hits 0 and timer has stopped, advance phase
    useEffect(() => {
        if (secondsLeft === 0 && !running && phase !== 'idle') {
            advancePhase(phase, sessions);
        }
    }, [secondsLeft, running, phase, sessions, advancePhase]);

    // Controls
    const start = useCallback(() => {
        if (phase === 'idle') {
            const dur = workMin * 60;
            setPhase('work');
            setSecondsLeft(dur);
            setTotalSeconds(dur);
            secondsAtStartRef.current = dur;
        }
        setRunning(true);
    }, [phase, workMin]);

    const pause = useCallback(() => {
        // Save elapsed progress before pausing
        setSecondsLeft(s => {
            secondsAtStartRef.current = s;
            return s;
        });
        setRunning(false);
    }, []);

    const reset = useCallback(() => {
        setRunning(false);
        setPhase('idle');
        setSessions(0);
        const dur = workMin * 60;
        setSecondsLeft(dur);
        setTotalSeconds(dur);
        secondsAtStartRef.current = dur;
        tickStartRef.current = null;
    }, [workMin]);

    const skip = useCallback(() => {
        setRunning(false);
        setSecondsLeft(0);
    }, []);

    const state: PomodoroState = {
        phase, running, secondsLeft, totalSeconds, sessions,
        workMin, breakMin, longBreakMin,
    };

    const controls: PomodoroControls = {
        start, pause, reset, skip, setWorkMin, setBreakMin, setLongBreakMin,
    };

    return [state, controls];
}
