// src/hooks/useDataLoader.ts
// Custom hook for loading questions and icons data
import { useState, useEffect } from 'react';
import { Unit, Question } from '../types';

const COLORS = ['blue', 'emerald', 'purple', 'rose', 'orange', 'indigo', 'cyan', 'amber', 'lime', 'violet'];

type Subject = 'biology' | 'chemistry';

interface UseDataLoaderReturn {
    units: Unit[];
    setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
    dataLoading: boolean;
    subject: Subject;
    setSubject: React.Dispatch<React.SetStateAction<Subject>>;
}

export function useDataLoader(): UseDataLoaderReturn {
    const [units, setUnits] = useState<Unit[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [subject, setSubject] = useState<Subject>(() => {
        const saved = localStorage.getItem('biomistrz_subject');
        return (saved === 'chemistry' ? 'chemistry' : 'biology') as Subject;
    });

    useEffect(() => {
        const loadAllData = async () => {
            try {
                const iconsResponse = await fetch('/Icons.json');
                const iconsData: any = await iconsResponse.json();
                const questionsFile = subject === 'biology' ? '/questions.json' : '/baza_danych_chemia.json';
                const questionsResponse = await fetch(questionsFile);
                if (!questionsResponse.ok) throw new Error(`Błąd pliku ${questionsFile}`);
                const questionsData = await questionsResponse.json();

                let processedUnits: Unit[] = [];
                let colorIndex = 0;

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

                questionsData.forEach((section: any) => {
                    const { sectionName, questions } = section;

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
            } catch (error) {
                console.error("Krytyczny błąd danych:", error);
            } finally {
                setTimeout(() => setDataLoading(false), 600);
            }
        };

        loadAllData();
    }, [subject]);

    // Save subject preference to localStorage
    useEffect(() => {
        localStorage.setItem('biomistrz_subject', subject);
    }, [subject]);

    return {
        units,
        setUnits,
        dataLoading,
        subject,
        setSubject
    };
}

export default useDataLoader;
