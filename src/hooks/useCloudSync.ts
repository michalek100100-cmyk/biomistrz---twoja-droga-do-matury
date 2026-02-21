// src/hooks/useCloudSync.ts
// Custom hook for syncing data to Firebase cloud
import { useEffect, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';
import { UserStats } from '../types';
import { User } from 'firebase/auth';

interface UseCloudSyncProps {
    user: User | null;
    stats: UserStats;
    quizProgress: Record<string, { index: number; score: number; wrongIndices: number[] }>;
    settings: { darkMode: boolean; sound: boolean; notifications: boolean };
    savedQuestions: string[];
    authLoading: boolean;
}

interface UseCloudSyncReturn {
    forceSync: () => Promise<void>;
}

export function useCloudSync({
    user,
    stats,
    quizProgress,
    settings,
    savedQuestions,
    authLoading
}: UseCloudSyncProps): UseCloudSyncReturn {

    const dataRef = useRef({ stats, quizProgress, settings, savedQuestions });

    // Keep ref updated
    useEffect(() => {
        dataRef.current = { stats, quizProgress, settings, savedQuestions };
    }, [stats, quizProgress, settings, savedQuestions]);

    // Core save function
    const saveToCloud = useCallback(async () => {
        if (!user || authLoading) return;
        try {
            const data = dataRef.current;
            const cleanStats = JSON.parse(JSON.stringify(data.stats));
            const cleanQuizProgress = JSON.parse(JSON.stringify(data.quizProgress));

            await setDoc(doc(db, 'users', user.uid), {
                stats: cleanStats,
                quizProgress: cleanQuizProgress,
                settings: data.settings,
                savedQuestions: data.savedQuestions,
                lastActive: new Date().toISOString()
            }, { merge: true });
            console.log('✅ Synced to Firebase');
        } catch (error) {
            console.error("❌ Błąd zapisu:", error);
        }
    }, [user, authLoading]);

    // Force sync (for profile save, quiz finish, etc.) — no debounce
    const forceSync = useCallback(async () => {
        // Save to localStorage immediately
        localStorage.setItem('biomistrz_stats', JSON.stringify(dataRef.current.stats));
        localStorage.setItem('biomistrz_quiz_progress', JSON.stringify(dataRef.current.quizProgress));
        localStorage.setItem('biomistrz_saved_questions', JSON.stringify(dataRef.current.savedQuestions));
        await saveToCloud();
    }, [saveToCloud]);

    // Save to cloud with debounce on any data change
    useEffect(() => {
        // Always save to localStorage
        localStorage.setItem('biomistrz_stats', JSON.stringify(stats));
        localStorage.setItem('biomistrz_quiz_progress', JSON.stringify(quizProgress));
        localStorage.setItem('biomistrz_saved_questions', JSON.stringify(savedQuestions));

        if (user && !authLoading) {
            const timeoutId = setTimeout(saveToCloud, 800);
            return () => clearTimeout(timeoutId);
        }
    }, [user, stats, authLoading, quizProgress, settings, savedQuestions, saveToCloud]);

    return { forceSync };
}

export default useCloudSync;
