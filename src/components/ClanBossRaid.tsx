import React, { useEffect, useState, useMemo } from 'react';
import { ClanBoss, Clan, Question } from '../types';
import { subscribeToClanBoss, spawnClanBossIfNeeded, attackClanBoss } from '../services/bossService';
import { getActiveBuffsClean } from '../services/inventoryService';
import { Loader2, Shield, Sword, Sparkles, Timer, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClanBossRaidProps {
    clan: Clan;
    userId: string;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    const parts = text.split('$');
    return (
        <span>
            {parts.map((part, index) => {
                if (index % 2 === 1) {
                    const formattedHtml = part
                        .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
                        .replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>')
                        .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
                        .replace(/\^([a-zA-Z0-9]+)/g, '<sup>$1</sup>');
                    return (
                        <span
                            key={index}
                            className="font-serif italic px-0.5"
                            dangerouslySetInnerHTML={{ __html: formattedHtml }}
                        />
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};

const ClanBossRaid: React.FC<ClanBossRaidProps> = ({ clan, userId }) => {
    const [boss, setBoss] = useState<ClanBoss | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Quiz State
    const [isQuizActive, setIsQuizActive] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [damageDealt, setDamageDealt] = useState<number | null>(null);
    const [multiplier, setMultiplier] = useState(1);

    useEffect(() => {
        let isMounted = true;
        const loadBuffs = async () => {
            const buffs = await getActiveBuffsClean(userId);
            if (isMounted) {
                const bossBuff = buffs.find(b => b.type === 'boss_damage_multiplier');
                setMultiplier(bossBuff ? bossBuff.multiplier : 1);
            }
        };
        loadBuffs();

        const checkBoss = async () => {
            await spawnClanBossIfNeeded(clan.id);
        };
        checkBoss();

        const unsub = subscribeToClanBoss(clan.id, (b) => {
            if (isMounted) {
                setBoss(b);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsub();
        };
    }, [clan.id]);

    const startRaid = async () => {
        setQuizLoading(true);
        setError('');
        try {
            const response = await fetch('/questions.json');
            const data = await response.json();

            // Flatten all questions from all sections
            let allQs: any[] = [];
            data.forEach((section: any) => {
                allQs = [...allQs, ...section.questions];
            });

            // Randomly pick 10 questions
            const shuffled = allQs.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 10).map(q => ({
                id: q.id || Math.random().toString(),
                type: q.options ? 'multiple_choice' : 'true_false',
                question: q.question,
                options: q.options || ['Prawda', 'Fałsz'],
                correctAnswer: q.answer || q.correctAnswer,
                explanation: q.explanation,
                topic: q.topic,
                category: q.category
            }));

            setQuestions(selected as Question[]);
            setIsQuizActive(true);
            setCurrentIndex(0);
            setCorrectCount(0);
            setDamageDealt(null);
        } catch (e) {
            setError('Nie udało się załadować pytań.');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleAnswer = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);

        const currentQ = questions[currentIndex];
        if (option === currentQ.correctAnswer) {
            setCorrectCount((prev: number) => prev + 1);
        }
    };

    const nextQuestion = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev: number) => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            // End of quiz - calculate damage and send
            const totalDamage = Math.round(correctCount * 40 * multiplier);
            setDamageDealt(totalDamage);
            setIsQuizActive(false);

            if (totalDamage > 0) {
                const result = await attackClanBoss(clan.id, userId, totalDamage);
                if (!result.success) {
                    setError(result.error || 'Błąd zapisu obrażeń!');
                }
            }
        }
    };

    const shuffledOptions = useMemo(() => {
        if (!questions[currentIndex]) return [];
        const q = questions[currentIndex];
        if (q.type === 'true_false') return ['Prawda', 'Fałsz'];
        return [...(q.options || [])].sort(() => Math.random() - 0.5);
    }, [questions, currentIndex]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-700 rounded-3xl">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!boss) {
        return (
            <div className="text-center py-10 bg-gray-800/50 rounded-3xl border border-gray-700">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-xl font-black text-white">Brak aktywnego bossa</h3>
                <p className="text-gray-400 text-sm mt-2">Wróc później, lider klanu wkrótce przyzwie nową bestię.</p>
            </div>
        );
    }

    if (isQuizActive && questions.length > 0) {
        const currentQ = questions[currentIndex];
        return (
            <div className="bg-gray-900 border-2 border-purple-500 rounded-[2.5rem] p-6 space-y-6 relative overflow-hidden animate-in zoom-in duration-300">
                <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Pytanie {currentIndex + 1} / {questions.length}
                    </span>
                    <span className="text-emerald-400 font-black text-xs">Punkty: {correctCount * 40} DMG</span>
                </div>

                <div className="text-center py-4">
                    <h3 className="text-xl font-black text-white leading-tight">
                        <FormattedText text={currentQ.question} />
                    </h3>
                </div>

                <div className="grid gap-3">
                    {shuffledOptions.map((opt, idx) => {
                        const isSelected = opt === selectedOption;
                        const isCorrect = opt === currentQ.correctAnswer;
                        let btnClass = "bg-gray-800 border-gray-700 text-gray-300";

                        if (isAnswered) {
                            if (isCorrect) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                            else if (isSelected) btnClass = "bg-red-500/20 border-red-500 text-red-400";
                        } else if (isSelected) {
                            btnClass = "bg-purple-500/20 border-purple-500 text-purple-400";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(opt)}
                                disabled={isAnswered}
                                className={`p-4 text-left font-bold rounded-2xl border-2 transition-all ${btnClass}`}
                            >
                                <FormattedText text={opt} />
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {isAnswered && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={nextQuestion}
                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40"
                        >
                            {currentIndex === questions.length - 1 ? 'Zakończ Rajd' : 'Następne pytanie'} <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    const hpPercent = Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100));
    const isDead = boss.currentHp <= 0;
    const isExpired = boss.activeUntil < Date.now();

    const topAttackers = Object.entries(boss.participants)
        .map(([uid, dmg]) => ({ uid, dmg: dmg as number }))
        .sort((a, b) => b.dmg - a.dmg)
        .slice(0, 5);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className={`p-6 rounded-[2.5rem] border-2 ${isDead ? 'border-emerald-500 bg-emerald-900/10' : 'border-purple-500 bg-purple-900/10'} relative overflow-hidden text-center`}>
                <div className="text-8xl mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    {boss.avatar}
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">{boss.name}</h3>

                <div className="flex justify-center items-center gap-2 mt-2 mb-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Timer className="w-3 h-3 text-orange-400" />
                    <span>Zniknie: {new Date(boss.activeUntil).toLocaleString()}</span>
                </div>

                <div className="px-6 mb-8">
                    <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">
                        <span>Status HP</span>
                        <span className={isDead ? 'text-emerald-400' : 'text-white'}>{boss.currentHp} / {boss.maxHp}</span>
                    </div>
                    <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${hpPercent}%` }}
                            className={`h-full ${isDead ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-600 to-rose-500'} shadow-[0_0_10px_rgba(239,68,68,0.3)]`}
                        />
                    </div>
                </div>

                {!isDead && !isExpired ? (
                    <div className="px-4">
                        {damageDealt !== null && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 font-bold text-sm"
                            >
                                Zadano {damageDealt} DMG w ostatnim rajdzie! 💥
                            </motion.div>
                        )}
                        <button
                            onClick={startRaid}
                            disabled={quizLoading}
                            className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase text-lg rounded-3xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 group"
                        >
                            {quizLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Sword className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                    Rozpocznij Rajd (10 pytań)
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-gray-500 font-bold mt-4 uppercase tracking-widest">
                            Każda dobra odpowiedź to <span className="text-emerald-500">{Math.round(40 * multiplier)} DMG</span>
                            {multiplier > 1 && <span className="text-purple-400 ml-1">(x{multiplier} Aktywny!)</span>}
                        </p>
                    </div>
                ) : (
                    <div className="py-6 flex flex-col items-center gap-3">
                        {isDead ? (
                            <>
                                <div className="p-4 bg-emerald-500/20 rounded-full">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </div>
                                <span className="text-emerald-400 font-black uppercase tracking-widest text-xl">Bestia Pokonana! 🏆</span>
                                <p className="text-gray-400 text-xs font-bold">Gratulacje dla klanu!</p>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-red-500/20 rounded-full">
                                    <XCircle className="w-12 h-12 text-red-500" />
                                </div>
                                <span className="text-red-400 font-black uppercase tracking-widest text-xl">Boss Uciekł! 🏃‍♂️</span>
                                <p className="text-gray-400 text-xs font-bold">Musicie być szybsi następnym razem.</p>
                            </>
                        )}
                    </div>
                )}
                {error && <p className="text-red-400 text-[10px] font-bold mt-4 bg-red-500/10 py-2 rounded-xl border border-red-500/20">{error}</p>}
            </div>

            <div className="bg-gray-900/80 p-6 rounded-[2.5rem] border border-gray-800 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <h4 className="font-black text-gray-400 text-sm uppercase tracking-widest">Bohaterowie Klanu</h4>
                </div>
                {topAttackers.length === 0 ? (
                    <p className="text-gray-600 text-center py-6 text-xs font-bold italic tracking-wide">Nikt jeszcze nie podniósł miecza...</p>
                ) : (
                    <div className="space-y-3">
                        {topAttackers.map((a, i) => {
                            const pName = clan.members[a.uid]?.name || 'Nieznany';
                            return (
                                <motion.div
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={a.uid}
                                    className="flex justify-between items-center p-4 bg-gray-800/40 rounded-2xl border border-gray-700/50 hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-yellow-500 text-black' :
                                            i === 1 ? 'bg-gray-300 text-black' :
                                                i === 2 ? 'bg-orange-500 text-black' : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {i + 1}
                                        </span>
                                        <span className="font-bold text-gray-200 text-sm">{pName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-purple-400 text-sm tabular-nums">{a.dmg}</span>
                                        <span className="text-[10px] font-black text-purple-600 uppercase">DMG</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClanBossRaid;

