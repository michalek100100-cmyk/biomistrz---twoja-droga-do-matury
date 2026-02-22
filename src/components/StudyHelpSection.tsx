// src/components/StudyHelpSection.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Timer, Zap, Play, Pause, RotateCcw, Coffee, BookOpen,
    ChevronLeft, CheckCircle2, Gauge, Settings2
} from 'lucide-react';
import { PomodoroState, PomodoroControls } from '../hooks/usePomodoroTimer';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type MainView = 'menu' | 'pomodoro' | 'rsvp';

// ─────────────────────────────────────────────
// UTILS: RSVP helpers
// ─────────────────────────────────────────────
const prepareCustomText = (text: string): string[] => {
    const clean = text
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return clean.split(' ').filter(w => w.length > 0);
};

const getRSVPWordParts = (word: string) => {
    if (!word) return { left: '', center: '', right: '' };
    const centerIndex = Math.floor((word.length - 1) / 2);
    return {
        left: word.slice(0, centerIndex),
        center: word[centerIndex],
        right: word.slice(centerIndex + 1)
    };
};

// ─────────────────────────────────────────────
// POMODORO VIEW – receives external state
// ─────────────────────────────────────────────
interface PomodoroViewProps {
    onBack: () => void;
    state: PomodoroState;
    controls: PomodoroControls;
}

const PomodoroView: React.FC<PomodoroViewProps> = ({ onBack, state, controls }) => {
    const {
        phase, running, secondsLeft, totalSeconds, sessions,
        workMin, breakMin, longBreakMin
    } = state;
    const { start, pause, reset, skip, setWorkMin, setBreakMin, setLongBreakMin } = controls;

    const [showSettings, setShowSettings] = useState(false);

    const handleSettingChange = (
        setter: (v: number | ((p: number) => number)) => void,
        delta: number,
        min: number,
        max: number,
        current: number
    ) => {
        const next = Math.min(max, Math.max(min, current + delta));
        setter(next);
        reset();
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    const RADIUS = 90;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    const phaseColors = {
        idle: { ring: '#6366f1', text: 'text-indigo-600', bg: 'from-indigo-500 to-violet-600', label: 'Gotowy' },
        work: { ring: '#22c55e', text: 'text-green-600', bg: 'from-green-500 to-emerald-600', label: `Nauka (${workMin} min)` },
        break: { ring: '#f97316', text: 'text-orange-500', bg: 'from-orange-400 to-amber-500', label: `Krótka przerwa (${breakMin} min)` },
        longBreak: { ring: '#3b82f6', text: 'text-blue-500', bg: 'from-blue-500 to-cyan-500', label: `Długa przerwa (${longBreakMin} min)` },
    };
    const colors = phaseColors[phase];

    const sessionDots = sessions % 4 === 0 && sessions > 0 ? 4 : sessions % 4;

    return (
        <div className="flex flex-col items-center gap-6 min-h-[60vh] pt-2">
            {/* Header */}
            <div className="flex items-center gap-3 w-full">
                <button onClick={onBack} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-2xl font-black text-gray-800 flex-1">Zegar Pomodoro</h2>
                <button
                    onClick={() => setShowSettings(s => !s)}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <Settings2 className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Running banner – shows when timer is active */}
            {running && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2"
                >
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm font-bold text-green-700">
                        Timer działa w tle – możesz odejść i wrócić tutaj w dowolnym momencie 🚀
                    </p>
                </motion.div>
            )}

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full overflow-hidden"
                    >
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-4 border border-gray-100">
                            <h3 className="font-black text-gray-700 text-sm uppercase tracking-widest">Ustawienia czasów</h3>
                            {[
                                { label: 'Nauka (min)', value: workMin, setter: setWorkMin, min: 1, max: 60 },
                                { label: 'Krótka przerwa (min)', value: breakMin, setter: setBreakMin, min: 1, max: 30 },
                                { label: 'Długa przerwa (min)', value: longBreakMin, setter: setLongBreakMin, min: 5, max: 60 },
                            ].map(({ label, value, setter, min, max }) => (
                                <div key={label} className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-gray-600 flex-1">{label}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSettingChange(setter, -1, min, max, value)}
                                            className="w-8 h-8 rounded-full bg-gray-200 font-black text-gray-700 hover:bg-gray-300 transition-colors"
                                        >−</button>
                                        <span className="text-lg font-black text-gray-800 w-8 text-center">{value}</span>
                                        <button
                                            onClick={() => handleSettingChange(setter, +1, min, max, value)}
                                            className="w-8 h-8 rounded-full bg-gray-200 font-black text-gray-700 hover:bg-gray-300 transition-colors"
                                        >+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase label */}
            <div className={`text-sm font-black uppercase tracking-widest ${colors.text}`}>
                {colors.label}
            </div>

            {/* Circle Timer */}
            <div className="relative flex items-center justify-center">
                <svg width="220" height="220" className="-rotate-90">
                    <circle cx="110" cy="110" r={RADIUS} stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <motion.circle
                        cx="110" cy="110" r={RADIUS}
                        stroke={colors.ring}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.5, ease: 'linear' }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className={`text-5xl font-black font-mono ${colors.text}`}>{formatTime(secondsLeft)}</span>
                    {sessions > 0 && (
                        <div className="flex gap-1 mt-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full transition-colors ${i < sessionDots ? 'bg-green-500' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {sessions > 0 && (
                <p className="text-sm text-gray-500 font-bold">
                    Ukończone sesje: <span className="text-green-600 font-black">{sessions}</span>
                </p>
            )}

            {/* Controls */}
            <div className="flex gap-4 items-center">
                <button onClick={reset} className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <RotateCcw className="w-6 h-6 text-gray-500" />
                </button>

                <button
                    onClick={running ? pause : start}
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${colors.bg} shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform`}
                >
                    {running
                        ? <Pause className="w-9 h-9 text-white" />
                        : <Play className="w-9 h-9 ml-1 text-white" />
                    }
                </button>

                <button onClick={skip} className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title="Pomiń etap">
                    <Coffee className="w-6 h-6 text-gray-500" />
                </button>
            </div>

            <p className="text-xs text-gray-400 font-bold text-center">
                {phase === 'idle' && '▶ Naciśnij play, żeby zacząć naukę'}
                {phase === 'work' && '🧠 Czas na skupioną naukę! Wyłącz rozpraszacze.'}
                {phase === 'break' && '☕ Krótka przerwa. Wstań i się przeciągnij!'}
                {phase === 'longBreak' && '🏖️ Długa przerwa. Zasłużony odpoczynek!'}
            </p>
        </div>
    );
};

// ─────────────────────────────────────────────
// RSVP CUSTOM TEXT COMPONENT
// ─────────────────────────────────────────────
const RSVPView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [customText, setCustomText] = useState('');
    const [rsvpWords, setRsvpWords] = useState<string[]>([]);
    const [rsvpIndex, setRsvpIndex] = useState(0);
    const [rsvpPlaying, setRsvpPlaying] = useState(false);
    const [wpm, setWpm] = useState(350);
    const [inRsvp, setInRsvp] = useState(false);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (rsvpPlaying && inRsvp && rsvpIndex < rsvpWords.length) {
            const delay = 60000 / wpm;
            const word = rsvpWords[rsvpIndex];
            const finalDelay = (word.includes('.') || word.includes(',')) ? delay * 1.5 : delay;
            timeout = setTimeout(() => setRsvpIndex(prev => prev + 1), finalDelay);
        } else if (rsvpIndex >= rsvpWords.length && rsvpWords.length > 0) {
            setRsvpPlaying(false);
        }
        return () => clearTimeout(timeout);
    }, [rsvpPlaying, inRsvp, rsvpIndex, wpm, rsvpWords]);

    const handleStartRsvp = () => {
        const words = prepareCustomText(customText);
        if (words.length === 0) return;
        setRsvpWords(words);
        setRsvpIndex(0);
        setRsvpPlaying(false);
        setInRsvp(true);
    };

    const handleExitRsvp = () => {
        setInRsvp(false);
        setRsvpPlaying(false);
        setRsvpIndex(0);
        setRsvpWords([]);
    };

    const isHighSpeed = wpm >= 1000;
    const wordParts = getRSVPWordParts(rsvpWords[rsvpIndex] || '');
    const finished = rsvpIndex >= rsvpWords.length && rsvpWords.length > 0;

    if (inRsvp) {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white">
                <button
                    onClick={handleExitRsvp}
                    className="absolute right-6 p-2 hover:bg-gray-800 rounded-full transition-colors"
                    style={{ top: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
                >
                    <X className="w-8 h-8 text-gray-400" />
                </button>

                {!rsvpPlaying && rsvpIndex === 0 && !finished ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8 max-w-md px-4"
                    >
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-pulse">
                            <Zap className="w-12 h-12 text-black fill-current" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tight">Mój Tryb Ultra</h2>
                        <p className="text-gray-400 text-lg">
                            Skup wzrok na <span className="text-red-500 font-bold">czerwonej literze</span> każdego słowa.
                        </p>
                        <button
                            onClick={() => setRsvpPlaying(true)}
                            className="px-10 py-4 bg-white text-black text-xl font-black rounded-2xl hover:scale-105 transition-transform shadow-xl"
                        >
                            ZACZNIJ
                        </button>
                        <p className="text-sm text-gray-500 font-mono">
                            Słów: {rsvpWords.length} • ~{Math.ceil(rsvpWords.length / wpm)} min przy {wpm} WPM
                        </p>
                    </motion.div>
                ) : (
                    <div className="w-full max-w-4xl flex flex-col items-center gap-12 px-4">
                        <div className="w-full max-w-md h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-100"
                                style={{ width: `${(rsvpIndex / rsvpWords.length) * 100}%` }}
                            />
                        </div>

                        <div className="relative w-full h-40 flex items-center justify-center font-mono text-5xl md:text-7xl font-bold select-none">
                            <div className="absolute top-0 bottom-0 w-[2px] bg-gray-800 left-1/2 -translate-x-1/2 z-0 opacity-30" />
                            <div className="absolute left-4 right-4 h-[1px] bg-gray-800 top-1/2 -translate-y-1/2 z-0 opacity-30" />
                            <div className="flex items-baseline w-full z-10">
                                <span className="flex-1 text-right text-gray-300">{wordParts.left}</span>
                                <span className="text-red-500 mx-0.5 transform scale-110 inline-block">{wordParts.center}</span>
                                <span className="flex-1 text-left text-gray-300">{wordParts.right}</span>
                            </div>
                        </div>

                        <div className="w-full max-w-sm flex flex-col items-center gap-6">
                            <button
                                onClick={() => setRsvpPlaying(p => !p)}
                                className="p-6 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
                            >
                                {rsvpPlaying ? <Pause className="w-10 h-10 text-white" /> : <Play className="w-10 h-10 ml-1 text-white" />}
                            </button>

                            <div className="w-full space-y-4 pt-4">
                                <div className="relative w-full h-6 flex items-center">
                                    <input
                                        type="range" min="100" max="1500" step="50" value={wpm}
                                        onChange={e => setWpm(Number(e.target.value))}
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer z-10 focus:outline-none"
                                        style={{ background: 'transparent' }}
                                    />
                                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-lg overflow-hidden pointer-events-none">
                                        <div className="w-full h-full" style={{ background: 'linear-gradient(90deg, #22c55e 0%, #22c55e 64%, #eab308 64%, #eab308 100%)' }} />
                                    </div>
                                </div>
                                <div className={`flex flex-col items-center transition-colors duration-300 ${isHighSpeed ? 'text-yellow-500' : 'text-gray-400'}`}>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black font-mono">{wpm}</span>
                                        <span className="text-sm font-bold mb-1.5">WPM</span>
                                    </div>
                                    {isHighSpeed && (
                                        <span className="text-[10px] uppercase font-black tracking-widest animate-pulse flex items-center gap-1">
                                            <Gauge className="w-3 h-3" /> Strefa Prędkości
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {finished && !rsvpPlaying && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center space-y-6 z-50"
                            >
                                <CheckCircle2 className="w-20 h-20 text-green-500" />
                                <h3 className="text-3xl font-black">Trening zakończony!</h3>
                                <button onClick={handleExitRsvp} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                                    Wróć
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 min-h-[60vh] pt-2">
            <div className="flex items-center gap-3 w-full">
                <button onClick={onBack} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-gray-800">Mój Tryb Ultra</h2>
                    <p className="text-sm text-gray-400 font-medium">Wklej własny tekst do szybkiego czytania</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 flex gap-3">
                <Zap className="w-8 h-8 text-green-500 fill-current shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-black text-green-800 mb-1">Technologia RSVP</h4>
                    <p className="text-sm text-green-700">
                        Słowa wyświetlają się jedno po drugim. Skup wzrok na{' '}
                        <span className="text-red-500 font-black">czerwonej literze</span>{' '}
                        – mózg czyta błyskawicznie bez ruchu gałek ocznych!
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-black text-gray-600 uppercase tracking-widest">Twój tekst</label>
                <textarea
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Wklej tutaj tekst do nauki – notatki, artykuł, streszczenie tematu..."
                    className="w-full h-48 p-4 rounded-2xl border-2 border-gray-200 focus:border-green-400 focus:outline-none resize-none text-gray-700 font-medium text-sm leading-relaxed bg-white transition-colors placeholder:text-gray-300"
                />
                <div className="flex justify-between items-center text-xs text-gray-400 font-mono px-1">
                    <span>{customText.length} znaków</span>
                    <span>~{Math.ceil(prepareCustomText(customText).length / 350)} min przy 350 WPM</span>
                </div>
            </div>

            <button
                onClick={handleStartRsvp}
                disabled={customText.trim().length < 5}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg uppercase tracking-widest shadow-lg shadow-green-200 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
                <Zap className="w-6 h-6 fill-current" />
                Zacznij Czytać
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
interface StudyHelpSectionProps {
    pomodoroState: PomodoroState;
    pomodoroControls: PomodoroControls;
}

const StudyHelpSection: React.FC<StudyHelpSectionProps> = ({ pomodoroState, pomodoroControls }) => {
    const [view, setView] = useState<MainView>('menu');

    if (view === 'pomodoro') {
        return <PomodoroView onBack={() => setView('menu')} state={pomodoroState} controls={pomodoroControls} />;
    }
    if (view === 'rsvp') {
        return <RSVPView onBack={() => setView('menu')} />;
    }

    const tools = [
        {
            id: 'pomodoro' as MainView,
            icon: Timer,
            label: 'Zegar Pomodoro',
            description: 'Technika 25/5 – ucz się w skupionych blokach z przerwami',
            gradient: 'from-indigo-500 to-violet-600',
            glow: 'shadow-indigo-200',
            badge: '🔔 Dźwięk dzwonka',
            active: pomodoroState.phase !== 'idle',
        },
        {
            id: 'rsvp' as MainView,
            icon: Zap,
            label: 'Mój Tryb Ultra',
            description: 'Wklej własny tekst i czytaj błyskawicznie w trybie RSVP',
            gradient: 'from-green-500 to-emerald-600',
            glow: 'shadow-green-200',
            badge: '⚡ Szybkie czytanie',
            active: false,
        },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-teal-500" /> Pomoc w nauce
                    </h2>
                    <p className="text-sm text-gray-400">Narzędzia, które pomogą Ci się efektywnie uczyć</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {tools.map((tool, index) => {
                    const Icon = tool.icon;
                    return (
                        <motion.button
                            key={tool.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setView(tool.id)}
                            className={`relative w-full bg-gradient-to-br ${tool.gradient} p-6 rounded-3xl text-white text-left shadow-xl ${tool.glow} hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden`}
                        >
                            {/* Active pulse indicator */}
                            {tool.active && (
                                <span className="absolute top-4 right-4 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                                </span>
                            )}
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
                                    <Icon className="w-8 h-8 text-white fill-current" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black mb-1">{tool.label}</h3>
                                    <p className="text-sm text-white/80 font-medium leading-snug">{tool.description}</p>
                                    {tool.active ? (
                                        <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest bg-white/30 px-2 py-0.5 rounded-full">
                                            ▶ Timer aktywny
                                        </span>
                                    ) : (
                                        <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                                            {tool.badge}
                                        </span>
                                    )}
                                </div>
                                <ChevronLeft className="w-6 h-6 text-white/60 rotate-180 shrink-0" />
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h4 className="font-black text-amber-800 text-sm mb-2">💡 Wskazówka BioMistrza</h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                    Połącz oba narzędzia: użyj Pomodoro do organizacji czasu, a Tryb Ultra do szybkiej powtórki materiału w blokach nauki!
                </p>
            </div>
        </motion.div>
    );
};

export default StudyHelpSection;
