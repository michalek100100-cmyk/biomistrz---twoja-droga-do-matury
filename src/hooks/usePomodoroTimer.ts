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

    // Tick
    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        setRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [running]);

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
        }
        setRunning(true);
    }, [phase, workMin]);

    const pause = useCallback(() => setRunning(false), []);

    const reset = useCallback(() => {
        setRunning(false);
        setPhase('idle');
        setSessions(0);
        setSecondsLeft(workMin * 60);
        setTotalSeconds(workMin * 60);
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
