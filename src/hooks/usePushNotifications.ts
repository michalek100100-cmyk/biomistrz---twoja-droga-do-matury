// src/hooks/usePushNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    isPushSupported,
    registerForPushNotifications,
    saveFCMToken,
    initLocalNotifications,
    setupPushListeners,
    setupLocalListeners,
    scheduleSRSReminder,
    scheduleStreakReminder,
    scheduleDailyGoalReminder,
    cancelAllNotifications,
    showInstantNotification,
    NotificationCategory
} from '../services/notificationService';

interface UsePushNotificationsReturn {
    isSupported: boolean;
    isRegistered: boolean;
    fcmToken: string | null;
    scheduleReminders: (options: ReminderOptions) => Promise<void>;
    showNotification: (title: string, body: string, category?: NotificationCategory) => Promise<void>;
    cancelAll: () => Promise<void>;
}

interface ReminderOptions {
    srsTopicCount?: number;
    currentStreak?: number;
    remainingXP?: number;
}

/**
 * Hook do zarządzania powiadomieniami push i lokalnymi
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
    const { user } = useAuth();
    const [isRegistered, setIsRegistered] = useState(false);
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    const isSupported = isPushSupported();

    // Inicjalizacja przy montowaniu
    useEffect(() => {
        if (!isSupported || !user) return;

        const init = async () => {
            // Inicjalizuj lokalne powiadomienia
            await initLocalNotifications();

            // Zarejestruj push notifications
            const token = await registerForPushNotifications();

            if (token) {
                setFcmToken(token);
                setIsRegistered(true);

                // Zapisz token do Firebase
                await saveFCMToken(user.uid, token);
            }

            // Ustaw listenery
            setupPushListeners(
                (notification) => {
                    console.log('Received push:', notification.title);
                },
                (action) => {
                    // Obsłuż kliknięcie w powiadomienie
                    const data = action.notification.data;
                    if (data?.category === 'srs_reminder') {
                        // Można nawigować do sekcji powtórek
                        console.log('Navigate to reviews');
                    }
                }
            );

            setupLocalListeners();
        };

        init();
    }, [isSupported, user]);

    /**
     * Planuje przypomnienia na podstawie aktualnego stanu użytkownika
     */
    const scheduleReminders = useCallback(async (options: ReminderOptions) => {
        if (!isSupported) return;

        const { srsTopicCount, currentStreak, remainingXP } = options;

        // Anuluj stare powiadomienia
        await cancelAllNotifications();

        // Planuj nowe
        if (srsTopicCount && srsTopicCount > 0) {
            await scheduleSRSReminder(srsTopicCount);
        }

        if (currentStreak !== undefined) {
            await scheduleStreakReminder(currentStreak);
        }

        if (remainingXP && remainingXP > 0) {
            await scheduleDailyGoalReminder(remainingXP);
        }
    }, [isSupported]);

    /**
     * Pokazuje natychmiastowe powiadomienie
     */
    const showNotification = useCallback(async (
        title: string,
        body: string,
        category: NotificationCategory = 'general'
    ) => {
        if (!isSupported) return;
        await showInstantNotification(title, body, category);
    }, [isSupported]);

    /**
     * Anuluje wszystkie zaplanowane powiadomienia
     */
    const cancelAll = useCallback(async () => {
        if (!isSupported) return;
        await cancelAllNotifications();
    }, [isSupported]);

    return {
        isSupported,
        isRegistered,
        fcmToken,
        scheduleReminders,
        showNotification,
        cancelAll
    };
};

export default usePushNotifications;
