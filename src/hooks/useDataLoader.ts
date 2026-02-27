// src/hooks/useDataLoader.ts
// Custom hook for loading questions and icons data
import { useState, useEffect } from 'react';
import { Unit, Question } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const COLORS = ['blue', 'emerald', 'purple', 'rose', 'orange', 'indigo', 'cyan', 'amber', 'lime', 'violet'];

type Subject = 'biology' | 'chemistry';

interface UseDataLoaderReturn {
    units: Unit[];
    setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
    dataLoading: boolean;
    subject: Subject;
    setSubject: React.Dispatch<React.SetStateAction<Subject>>;
    chemistryNotTranslated: boolean;
}

export function useDataLoader(): UseDataLoaderReturn {
    const { language, t } = useLanguage();
    const [units, setUnits] = useState<Unit[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [chemistryNotTranslated, setChemistryNotTranslated] = useState(false);
    const [subject, setSubject] = useState<Subject>(() => {
        const saved = localStorage.getItem('biomistrz_subject');
        return (saved === 'chemistry' ? 'chemistry' : 'biology') as Subject;
    });

    useEffect(() => {
        const fetchJSON = async (url: string) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed for ${url}`);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Not a JSON response for ${url}`);
            }
            return await response.json();
        };

        const loadAllData = async () => {
            try {
                const iconsData = await fetchJSON('/Icons.json');

                // Filename suffixes for various languages
                const langMap: Record<string, string> = {
                    'en': '_en',
                    'ch': '_ZH',
                    'cz': '_CZ',
                    'de': '_DE',
                    'es': '_ES',
                    'jp': '_JA'
                };
                const langSuffix = langMap[language] || '';

                setChemistryNotTranslated(false);

                let questionsData: any;
                if (subject === 'biology') {
                    // Biology: Try language-specific, fallback to default (PL) if missing
                    const biologyFile = `/questions${langSuffix}.json`;
                    try {
                        questionsData = await fetchJSON(biologyFile);
                    } catch (e) {
                        console.warn(`Biology file ${biologyFile} missing or invalid, falling back to default.`);
                        questionsData = await fetchJSON('/questions.json');
                    }
                } else {
                    // Chemistry: Try language-specific, throw error if missing (unless PL)
                    const chemistryFile = `/baza_danych_chemia${langSuffix}.json`;
                    try {
                        questionsData = await fetchJSON(chemistryFile);
                    } catch (e) {
                        if (language !== 'pl') {
                            throw new Error('CHEMISTRY_NOT_TRANSLATED');
                        }
                        throw e;
                    }
                }

                // Load sections configuration
                let sectionsConfig: any[] = [];
                try {
                    sectionsConfig = await fetchJSON('/sections.json');
                } catch (e) {
                    console.warn("Could not load sections.json", e);
                }

                let processedUnits: Unit[] = [];
                let colorIndex = 0;

                const sanitizeQuestions = (qs: any[]): Question[] => qs.map(q => ({
                    id: q.id || Math.random(),
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
                        const tName = q.topic || "Inne";
                        if (!map[tName]) map[tName] = [];
                        map[tName].push(q);
                    });
                    return map;
                };

                if (subject === 'biology' && sectionsConfig.length > 0) {
                    const assignedQuestionIds = new Set<number>();

                    sectionsConfig.forEach((config) => {
                        const sectionQuestions = questionsData.filter((q: any) =>
                            config.ranges.some(([start, end]: [number, number]) => q.id >= start && q.id <= end)
                        );

                        if (sectionQuestions.length > 0) {
                            sectionQuestions.forEach((q: any) => assignedQuestionIds.add(q.id));
                            const topicsMap = groupByTopic(sectionQuestions);
                            const sectionName = t.sections[config.id.toString()] || config.displayName;

                            processedUnits.push({
                                id: `unit_${config.id}`,
                                title: sectionName,
                                icon: iconsData.sections[config.displayName] || iconsData.topics["Domyślny"],
                                description: `${t.practiceCenter.masterSection}: ${sectionName}`,
                                color: COLORS[colorIndex % COLORS.length],
                                topics: Object.keys(topicsMap).map((topicTitle, idx) => ({
                                    id: `topic_${config.id}_${idx}`,
                                    title: topicTitle,
                                    icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                                    description: `${t.practiceCenter.tasks}: ${topicTitle}`,
                                    questions: topicsMap[topicTitle],
                                    progress: 0,
                                    srsLevel: 0,
                                    nextReviewDate: undefined
                                }))
                            });
                            colorIndex++;
                        }
                    });

                    // Any questions not assigned to a section
                    const looseQuestions = questionsData.filter((q: any) => !assignedQuestionIds.has(q.id));
                    if (looseQuestions.length > 0) {
                        const topicsMap = groupByTopic(looseQuestions);
                        Object.keys(topicsMap).forEach((topicTitle) => {
                            processedUnits.push({
                                id: `unit_loose_${topicTitle}`,
                                title: topicTitle,
                                icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                                description: `${t.practiceCenter.topic}: ${topicTitle}`,
                                color: COLORS[colorIndex % COLORS.length],
                                topics: [{
                                    id: `topic_single_${topicTitle}`,
                                    title: topicTitle,
                                    icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                                    description: t.practiceCenter.fullBase,
                                    questions: topicsMap[topicTitle],
                                    progress: 0,
                                    srsLevel: 0,
                                    nextReviewDate: undefined
                                }]
                            });
                            colorIndex++;
                        });
                    }
                } else {
                    // Fallback for chemistry or if sections.json fails
                    const topicsMap = groupByTopic(questionsData);
                    Object.keys(topicsMap).forEach((topicTitle) => {
                        processedUnits.push({
                            id: `unit_loose_${topicTitle}`,
                            title: topicTitle,
                            icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                            description: `${t.practiceCenter.topic}: ${topicTitle}`,
                            color: COLORS[colorIndex % COLORS.length],
                            topics: [{
                                id: `topic_single_${topicTitle}`,
                                title: topicTitle,
                                icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                                description: t.practiceCenter.fullBase,
                                questions: topicsMap[topicTitle],
                                progress: 0,
                                srsLevel: 0,
                                nextReviewDate: undefined
                            }]
                        });
                        colorIndex++;
                    });
                }

                // Load saved progress from subject-specific localStorage key
                // Migration: if old shared key exists, move it to biology-specific key
                const oldProgress = localStorage.getItem('biomistrz_progress');
                if (oldProgress && !localStorage.getItem('biomistrz_progress_biology')) {
                    localStorage.setItem('biomistrz_progress_biology', oldProgress);
                    localStorage.removeItem('biomistrz_progress');
                    console.log('✅ Migrated old progress data to biomistrz_progress_biology');
                }

                const progressKey = `biomistrz_progress_${subject}`;
                const savedProgress = localStorage.getItem(progressKey);
                if (savedProgress) {
                    const progressMap = JSON.parse(savedProgress);
                    processedUnits = processedUnits.map(u => ({
                        ...u,
                        topics: u.topics.map(t => ({ ...t, ...(progressMap[t.id] || {}) }))
                    }));
                }

                setUnits(processedUnits);
            } catch (error: any) {
                console.error("Krytyczny błąd danych:", error);
                if (error.message === 'CHEMISTRY_NOT_TRANSLATED') {
                    setChemistryNotTranslated(true);
                    setUnits([]);
                }
            } finally {
                setTimeout(() => setDataLoading(false), 600);
            }
        };

        loadAllData();
    }, [subject, language]);

    // Save subject preference to localStorage
    useEffect(() => {
        localStorage.setItem('biomistrz_subject', subject);
    }, [subject]);

    return {
        units,
        setUnits,
        dataLoading,
        subject,
        setSubject,
        chemistryNotTranslated
    };
}

export default useDataLoader;
