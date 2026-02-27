// src/components/PracticeHub.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Timer, Zap, Play, Users, Heart, BookMarked,
    ChevronRight, Sparkles
} from 'lucide-react';
import { PomodoroState, PomodoroControls } from '../hooks/usePomodoroTimer';
import { useLanguage } from '../contexts/LanguageContext';
import { Topic, Unit } from '../types';
import StudyHelpSection from './StudyHelpSection';

interface PracticeHubProps {
    pomodoroState: PomodoroState;
    pomodoroControls: PomodoroControls;
    dueReviews: Topic[];
    savedQuestions: string[];
    units: Unit[];
    onStartTopic: (topic: Topic) => void;
    onStartSavedQuestions: () => void;
    onStartArena: () => void;
}

type MainView = 'hub' | 'pomodoro' | 'rsvp';

const PracticeHub: React.FC<PracticeHubProps> = ({
    pomodoroState,
    pomodoroControls,
    dueReviews,
    savedQuestions,
    onStartTopic,
    onStartSavedQuestions,
    onStartArena
}) => {
    const { t } = useLanguage();
    const [view, setView] = useState<MainView>('hub');

    if (view === 'pomodoro' || view === 'rsvp') {
        // We can reuse the inner views of StudyHelpSection logic or the component itself
        // Since StudyHelpSection already has the sub-navigation logic, we can just render it with a forced view
        return (
            <div className="max-w-2xl mx-auto py-8">
                <StudyHelpSection
                    pomodoroState={pomodoroState}
                    pomodoroControls={pomodoroControls}
                    initialView={view}
                    onBack={() => setView('hub')}
                />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto py-8 px-4 font-inter"
        >
            {/* Header */}
            <header className="mb-10 flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-[1.5rem] mb-6 shadow-sm">
                    <BookMarked className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black text-gray-800 tracking-tight mb-2">
                    {t.practiceCenter.title}
                </h1>
                <p className="text-gray-500 font-medium max-w-sm">
                    {t.practiceCenter.subtitle || "Twoje centrum efektywnej nauki i powtórek."}
                </p>
            </header>



            {/* Quick Actions Grid (Main Tools) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                {/* Pomodoro */}
                <button
                    onClick={() => setView('pomodoro')}
                    className="group relative flex flex-col p-6 rounded-[2rem] bg-indigo-50 border-2 border-transparent hover:border-indigo-200 transition-all text-left overflow-hidden"
                >
                    <div className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                        <Timer className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-indigo-900 mb-1">{t.studyHelp.pomodoro.title}</h3>
                    <p className="text-sm text-indigo-700/70 font-bold leading-snug">{t.studyHelp.pomodoro.badge}</p>
                    <div className="absolute top-4 right-4 text-indigo-300 group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                    {pomodoroState.running && (
                        <span className="absolute bottom-4 right-4 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                        </span>
                    )}
                </button>

                {/* RSVP / Ultra Mode */}
                <button
                    onClick={() => setView('rsvp')}
                    className="group relative flex flex-col p-6 rounded-[2rem] bg-emerald-50 border-2 border-transparent hover:border-emerald-200 transition-all text-left overflow-hidden"
                >
                    <div className="bg-emerald-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-emerald-900 mb-1">{t.studyHelp.rsvp.title}</h3>
                    <p className="text-sm text-emerald-700/70 font-bold leading-snug">{t.studyHelp.rsvp.badge}</p>
                    <div className="absolute top-4 right-4 text-emerald-300 group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                </button>

                {/* Arena 1v1 */}
                <button
                    onClick={onStartArena}
                    className="group relative flex flex-col p-6 rounded-[2rem] bg-violet-50 border-2 border-transparent hover:border-violet-200 transition-all text-left overflow-hidden"
                >
                    <div className="bg-violet-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-200">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-violet-900 mb-1">{t.practiceCenter.groupMode}</h3>
                    <p className="text-sm text-violet-700/70 font-bold leading-snug">{t.practiceCenter.groupModeDesc || "Pojedynki z innymi"}</p>
                    <div className="absolute top-4 right-4 text-violet-300 group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-6 h-6" />
                    </div>
                </button>
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SRS Section */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">{t.practiceCenter.srsTitle}</h2>
                        {dueReviews.length > 0 && (
                            <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {dueReviews.length} DO POWTÓRKI
                            </span>
                        )}
                    </div>

                    {dueReviews.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-8 text-center border-4 border-dashed border-gray-100">
                            <div className="text-4xl mb-3">🏆</div>
                            <h3 className="text-lg font-black text-gray-700 mb-1">{t.practiceCenter.emptySrsTitle}</h3>
                            <p className="text-gray-400 text-sm font-medium">{t.practiceCenter.emptySrsDesc}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dueReviews.map(topic => (
                                <button
                                    key={topic.id}
                                    onClick={() => onStartTopic(topic)}
                                    className="w-full bg-white p-5 rounded-[2rem] border-2 border-gray-50 flex justify-between items-center hover:border-orange-400 hover:scale-[1.01] transition-all duo-button-shadow"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{topic.icon}</span>
                                        <div className="text-left">
                                            <h4 className="text-base font-black text-gray-800 leading-tight">{topic.title}</h4>
                                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">{t.practiceCenter.requiredReview}</p>
                                        </div>
                                    </div>
                                    <Play className="w-6 h-6 text-orange-500 fill-current opacity-20" />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Favorites & Utilities */}
                <section className="space-y-6">
                    {/* Favorites */}
                    <div>
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 px-2">{t.practiceCenter.library}</h2>
                        {savedQuestions.length > 0 ? (
                            <button
                                onClick={onStartSavedQuestions}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 p-6 rounded-[2.5rem] text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex justify-between items-center group relative overflow-hidden"
                            >
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <Heart className="w-8 h-8 text-white fill-current" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-xl font-black text-white">{t.practiceCenter.savedQuestions}</h4>
                                        <p className="text-pink-100 text-xs font-bold opacity-90">{t.practiceCenter.questionsToReview.replace('$1', savedQuestions.length.toString())}</p>
                                    </div>
                                </div>
                                <Play className="w-10 h-10 text-white opacity-80 group-hover:scale-110 transition-transform relative z-10" />
                                <div className="absolute -right-6 -bottom-6 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                            </button>
                        ) : (
                            <div className="bg-gray-50 rounded-[2.5rem] p-8 text-center border-2 border-gray-100 flex flex-col items-center">
                                <Heart className="w-10 h-10 text-gray-300 mb-3" />
                                <h3 className="text-sm font-black text-gray-500 mb-1">Brak ulubionych pytań</h3>
                                <p className="text-[11px] text-gray-400 font-medium">Kliknij serduszko przy zadaniu, żeby je tu zapisać.</p>
                            </div>
                        )}
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100 flex gap-4">
                        <div className="bg-amber-200 text-amber-700 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <h4 className="font-black text-amber-900 text-sm mb-1">{t.studyHelp.tipsTitle}</h4>
                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                {t.studyHelp.mainTip}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

export default PracticeHub;
