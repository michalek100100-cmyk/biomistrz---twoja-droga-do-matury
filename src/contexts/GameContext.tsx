// src/contexts/GameContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';
import { UserStats, Unit, Question, ExamTask } from '../types';
import { useAuth } from './AuthContext';

// --- INITIAL VALUES ---
const INITIAL_STATS: UserStats = {
    name: 'BioMistrz',
    avatar: '',
    bio: 'Ambitny maturzysta dążący do perfekcji w biologii.',
    streak: 0,
    xp: 0,
    gems: 100,
    elo: 0,
    completedLessons: [],
    totalQuestionsAnswered: 0,
    dailyQuestionsAnswered: 0,
    dailyGoalCompleted: false,
    lastQuestionDate: '',
    lastGoalCompletedAt: 0
};

const COLORS = ['blue', 'emerald', 'purple', 'rose', 'orange', 'indigo', 'cyan', 'amber', 'lime', 'violet'];

interface GameContextType {
    stats: UserStats;
    setStats: React.Dispatch<React.SetStateAction<UserStats>>;
    updateStats: (updates: Partial<UserStats>) => void;
    units: Unit[];
    setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
    quizProgress: Record<string, { index: number; score: number; wrongIndices: number[] }>;
    setQuizProgress: React.Dispatch<React.SetStateAction<Record<string, { index: number; score: number; wrongIndices: number[] }>>>;
    savedQuestions: string[];
    toggleSavedQuestion: (questionId: string) => void;
    settings: { darkMode: boolean; sound: boolean; notifications: boolean };
    toggleSetting: (key: string) => void;
    customTasks: ExamTask[];
    setCustomTasks: React.Dispatch<React.SetStateAction<ExamTask[]>>;
    dataLoading: boolean;
    resetProgress: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within GameProvider');
    }
    return context;
};

interface GameProviderProps {
    children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const { user } = useAuth();

    // Stats
    const [stats, setStats] = useState<UserStats>(() => {
        const saved = localStorage.getItem('biomistrz_stats');
        return saved ? JSON.parse(saved) : INITIAL_STATS;
    });

    // Settings
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('biomistrz_settings');
        return saved ? JSON.parse(saved) : { darkMode: false, sound: true, notifications: true };
    });

    // Saved Questions
    const [savedQuestions, setSavedQuestions] = useState<string[]>(() => {
        const saved = localStorage.getItem('biomistrz_saved_questions');
        return saved ? JSON.parse(saved) : [];
    });

    // Quiz Progress
    const [quizProgress, setQuizProgress] = useState<Record<string, { index: number; score: number; wrongIndices: number[] }>>(() => {
        const saved = localStorage.getItem('biomistrz_quiz_progress');
        return saved ? JSON.parse(saved) : {};
    });

    // Units & Topics
    const [units, setUnits] = useState<Unit[]>([]);
    const [customTasks, setCustomTasks] = useState<ExamTask[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // --- LOAD DATA FROM JSON ---
    useEffect(() => {
        const loadAllData = async () => {
            try {
                const iconsResponse = await fetch('/Icons.json');
                const iconsData: any = await iconsResponse.json();
                const questionsResponse = await fetch('/questions.json');
                if (!questionsResponse.ok) throw new Error('Błąd pliku questions.json');
                const questionsData = await questionsResponse.json();

                let processedUnits: Unit[] = [];
                let colorIndex = 0;

                questionsData.forEach((section: any) => {
                    const { sectionName, questions } = section;
                    const sanitizeQuestions = (qs: any[]): Question[] => qs.map(q => ({
                        id: q.id || Math.random().toString(36).substr(2, 9),
                        type: q.options ? 'multiple_choice' : 'true_false',
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.answer || q.correctAnswer,
                        explanation: q.explanation || "Brak wyjaśnienia.",
                        category: q.category || "Ogólne",
                        topic: q.topic || "Inne"
                    }));

                    const groupByTopic = (qs: any[]) => {
                        const map: Record<string, Question[]> = {};
                        const cleanQs = sanitizeQuestions(qs);
                        cleanQs.forEach(q => {
                            const t = q.topic || "Inne";
                            if (!map[t]) map[t] = [];
                            map[t].push(q);
                        });
                        return map;
                    };

                    if (sectionName !== "Blank" && sectionName !== "") {
                        const topicsMap = groupByTopic(questions);
                        processedUnits.push({
                            id: `unit_${sectionName}`,
                            title: sectionName,
                            icon: iconsData.sections[sectionName] || iconsData.topics["Domyślny"],
                            description: `Opanuj dział: ${sectionName}`,
                            color: COLORS[colorIndex % COLORS.length],
                            topics: Object.keys(topicsMap).map((topicTitle, idx) => ({
                                id: `topic_${sectionName}_${idx}`,
                                title: topicTitle,
                                icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                                description: `Zadania: ${topicTitle}`,
                                questions: topicsMap[topicTitle],
                                progress: 0,
                                srsLevel: 0,
                                nextReviewDate: undefined
                            }))
                        });
                        colorIndex++;
                    } else {
                        const topicsMap = groupByTopic(questions);
                        Object.keys(topicsMap).forEach((topicTitle) => {
                            processedUnits.push({
                                id: `unit_loose_${topicTitle}`,
                                title: topicTitle,
                                icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                                description: `Temat: ${topicTitle}`,
                                color: COLORS[colorIndex % COLORS.length],
                                topics: [{
                                    id: `topic_single_${topicTitle}`,
                                    title: topicTitle,
                                    icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                                    description: `Kompletna baza zadań`,
                                    questions: topicsMap[topicTitle],
                                    progress: 0,
                                    srsLevel: 0,
                                    nextReviewDate: undefined
                                }]
                            });
                            colorIndex++;
                        });
                    }
                });

                // Load saved progress (GameContext only loads biology)
                const savedProgress = localStorage.getItem('biomistrz_progress_biology');
                if (savedProgress) {
                    const progressMap = JSON.parse(savedProgress);
                    processedUnits = processedUnits.map(u => ({
                        ...u,
                        topics: u.topics.map(t => ({ ...t, ...(progressMap[t.id] || {}) }))
                    }));
                }
                setUnits(processedUnits);
            } catch (error) {
                console.error("Krytyczny błąd danych:", error);
            } finally {
                setTimeout(() => setDataLoading(false), 600);
            }
        };
        loadAllData();
    }, []);

    // --- LOAD USER DATA FROM FIREBASE ---
    useEffect(() => {
        if (!user) return;

        const loadUserData = async () => {
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    let currentStats = { ...INITIAL_STATS, ...data.stats };
                    if (!currentStats.avatar && user.photoURL) currentStats.avatar = user.photoURL;
                    if ((!currentStats.name || currentStats.name === 'BioMistrz') && user.displayName) {
                        currentStats.name = user.displayName;
                    }

                    // Streak calculation based on daily goal completion
                    const lastActiveDate = data.lastActive;
                    if (lastActiveDate) {
                        const lastDate = new Date(lastActiveDate);
                        const today = new Date();
                        lastDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        const diffTime = today.getTime() - lastDate.getTime();
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays === 1) {
                            // Yesterday - only keep streak if yesterday's goal was completed
                            if (currentStats.dailyGoalCompleted) {
                                currentStats.streak = (currentStats.streak || 0) + 1;
                            } else {
                                currentStats.streak = 0;
                            }
                            // Reset daily counters for new day
                            currentStats.dailyQuestionsAnswered = 0;
                            currentStats.dailyGoalCompleted = false;
                        } else if (diffDays > 1) {
                            // Missed more than 1 day
                            currentStats.streak = 0;
                            currentStats.dailyQuestionsAnswered = 0;
                            currentStats.dailyGoalCompleted = false;
                        }
                        // diffDays === 0: same day - keep everything as is
                    } else {
                        // First time user
                        currentStats.streak = 0;
                        currentStats.dailyQuestionsAnswered = 0;
                        currentStats.dailyGoalCompleted = false;
                    }

                    setStats(currentStats);
                    if (data.customTasks) setCustomTasks(data.customTasks);
                    if (data.quizProgress) setQuizProgress(data.quizProgress);
                    if (data.savedQuestions) setSavedQuestions(data.savedQuestions);
                } else {
                    const newStats = {
                        ...INITIAL_STATS,
                        name: user.displayName || 'BioMistrz',
                        avatar: user.photoURL || ''
                    };
                    setStats(newStats);
                }
            } catch (error) {
                console.error("Błąd Firebase:", error);
            }
        };

        loadUserData();
    }, [user]);

    // --- DARK MODE EFFECT ---
    useEffect(() => {
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('biomistrz_settings', JSON.stringify(settings));
    }, [settings]);

    // --- SAVE TO LOCAL STORAGE ---
    useEffect(() => {
        localStorage.setItem('biomistrz_stats', JSON.stringify(stats));
        localStorage.setItem('biomistrz_quiz_progress', JSON.stringify(quizProgress));
        localStorage.setItem('biomistrz_saved_questions', JSON.stringify(savedQuestions));
    }, [stats, quizProgress, savedQuestions]);

    // --- SAVE PROGRESS ---
    useEffect(() => {
        if (units.length > 0) {
            const progressToSave: Record<string, any> = {};
            units.forEach(u => u.topics.forEach(t => {
                progressToSave[t.id] = {
                    progress: t.progress,
                    srsLevel: t.srsLevel,
                    nextReviewDate: t.nextReviewDate
                };
            }));
            localStorage.setItem('biomistrz_progress_biology', JSON.stringify(progressToSave));
        }
    }, [units]);

    // --- HELPER FUNCTIONS ---
    const updateStats = useCallback((updates: Partial<UserStats>) => {
        setStats(prev => ({ ...prev, ...updates }));
    }, []);

    const toggleSavedQuestion = useCallback((questionId: string) => {
        setSavedQuestions(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                return [...prev, questionId];
            }
        });
    }, []);

    const toggleSetting = useCallback((key: string) => {
        setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const resetProgress = useCallback(() => {
        setStats(INITIAL_STATS);
        setUnits(prev => prev.map(u => ({
            ...u,
            topics: u.topics.map(t => ({
                ...t,
                progress: 0,
                srsLevel: 0,
                nextReviewDate: undefined
            }))
        })));
        localStorage.clear();
    }, []);

    return (
        <GameContext.Provider value={{
            stats,
            setStats,
            updateStats,
            units,
            setUnits,
            quizProgress,
            setQuizProgress,
            savedQuestions,
            toggleSavedQuestion,
            settings,
            toggleSetting,
            customTasks,
            setCustomTasks,
            dataLoading,
            resetProgress
        }}>
            {children}
        </GameContext.Provider>
    );
};

export default GameContext;
