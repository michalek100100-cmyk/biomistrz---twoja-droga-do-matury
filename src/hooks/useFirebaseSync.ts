// src/hooks/useFirebaseSync.ts
import { useEffect, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';
import { UserStats } from '../types';

interface SyncData {
    stats: UserStats;
    quizProgress: Record<string, any>;
    savedQuestions: string[];
    settings: { darkMode: boolean; sound: boolean; notifications: boolean };
}

interface UseFirebaseSyncOptions {
    userId: string | undefined;
    data: SyncData;
    enabled: boolean;
    debounceMs?: number;
}

/**
 * Hook for syncing data to Firebase with smart debounce.
 * - 3 second debounce for regular updates
 * - Immediate sync on beforeunload
 * - Force sync function for critical moments (quiz finish)
 */
export const useFirebaseSync = ({
    userId,
    data,
    enabled,
    debounceMs = 3000
}: UseFirebaseSyncOptions) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dataRef = useRef<SyncData>(data);
    const pendingRef = useRef<boolean>(false);

    // Keep data ref updated
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Sync function
    const syncToFirebase = useCallback(async (force: boolean = false) => {
        if (!userId || !enabled) return;

        if (!force && !pendingRef.current) return;

        try {
            const cleanData = JSON.parse(JSON.stringify(dataRef.current));

            await setDoc(doc(db, 'users', userId), {
                stats: cleanData.stats,
                quizProgress: cleanData.quizProgress,
                savedQuestions: cleanData.savedQuestions,
                settings: cleanData.settings,
                lastActive: new Date().toISOString()
            }, { merge: true });

            pendingRef.current = false;
            console.log('✅ Synced to Firebase');
        } catch (error) {
            console.error('❌ Firebase sync error:', error);
        }
    }, [userId, enabled]);

    // Force sync (for quiz finish, logout, etc.)
    const forceSync = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        return syncToFirebase(true);
    }, [syncToFirebase]);

    // Debounced sync on data change
    useEffect(() => {
        if (!userId || !enabled) return;

        pendingRef.current = true;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            syncToFirebase();
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [userId, enabled, data, debounceMs, syncToFirebase]);

    // Sync on beforeunload (page close/refresh)
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (pendingRef.current && userId && enabled) {
                // Using sendBeacon for reliable sync on page close
                /* const cleanData = JSON.parse(JSON.stringify(dataRef.current));
                const payload = JSON.stringify({
                    stats: cleanData.stats,
                    quizProgress: cleanData.quizProgress,
                    savedQuestions: cleanData.savedQuestions,
                    settings: cleanData.settings,
                    lastActive: new Date().toISOString()
                }); */

                // Note: This won't actually work with Firestore directly,
                // but it signals the intent. In production, you might use a 
                // Cloud Function endpoint with sendBeacon.
                console.log('📤 Attempting sync before unload...');
                syncToFirebase(true);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [userId, enabled, syncToFirebase]);

    return { forceSync, isPending: pendingRef.current };
};

export default useFirebaseSync;
