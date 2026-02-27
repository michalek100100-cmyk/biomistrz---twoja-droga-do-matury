// src/services/notificationService.ts
// Service for managing push and local notifications

import { Capacitor } from '@capacitor/core';
import {
    PushNotifications,
    PushNotificationSchema,
    Token,
    ActionPerformed
} from '@capacitor/push-notifications';
import {
    LocalNotifications,
    LocalNotificationSchema
} from '@capacitor/local-notifications';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';

// --- TYPY POWIADOMIEŃ ---
export type NotificationCategory =
    | 'srs_reminder'      // Przypomnienie o powtórce
    | 'streak_warning'    // Ostrzeżenie o utracie serii
    | 'daily_goal'        // Dzienny cel
    | 'multiplayer_invite' // Zaproszenie do gry
    | 'achievement'       // Odblokowane osiągnięcie
    | 'general';          // Ogólne

export interface ScheduledNotification {
    id: number;
    category: NotificationCategory;
    title: string;
    body: string;
    scheduledAt: Date;
}

// --- STAŁE ---
const NOTIFICATION_CHANNEL_ID = 'biomistrz-notifications';

// --- INICJALIZACJA ---

export const isPushSupported = (): boolean => {
    return Capacitor.isNativePlatform();
};

/**
 * Sprawdza czy przeglądarka obsługuje powiadomienia Web
 */
export const isWebNotificationSupported = (): boolean => {
    return !Capacitor.isNativePlatform() && 'Notification' in window;
};

/**
 * Rejestruje urządzenie do powiadomień push
 * Zwraca token FCM lub null
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
    if (!isPushSupported()) {
        console.log('📵 Push notifications not supported on web');
        return null;
    }

    try {
        // Sprawdź uprawnienia
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.log('❌ Push notification permission not granted');
            return null;
        }

        // Zarejestruj
        await PushNotifications.register();

        // Token zostanie zwrócony przez event listener
        return new Promise((resolve) => {
            PushNotifications.addListener('registration', (token: Token) => {
                console.log('✅ Push registration success, token:', token.value);
                resolve(token.value);
            });

            PushNotifications.addListener('registrationError', (error: any) => {
                console.error('❌ Push registration failed:', error);
                resolve(null);
            });
        });
    } catch (error) {
        console.error('Push registration error:', error);
        return null;
    }
};

/**
 * Zapisuje token FCM do Firestore dla użytkownika
 */
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            fcmTokens: arrayUnion(token),
            lastTokenUpdate: new Date().toISOString()
        });
        console.log('✅ FCM token saved to Firestore');
    } catch (error) {
        console.error('Failed to save FCM token:', error);
    }
};

// --- LOKALNE POWIADOMIENIA ---

/**
 * Inicjalizuje lokalne powiadomienia
 */
export const initLocalNotifications = async (): Promise<boolean> => {
    if (!isPushSupported()) return false;

    try {
        const permStatus = await LocalNotifications.requestPermissions();

        if (permStatus.display !== 'granted') {
            console.log('❌ Local notification permission not granted');
            return false;
        }

        // Stwórz kanał powiadomień (Android)
        await LocalNotifications.createChannel({
            id: NOTIFICATION_CHANNEL_ID,
            name: 'BioMistrz Notifications',
            importance: 4, // HIGH
            description: 'Powiadomienia o nauce i powtórkach',
            sound: 'default',
            vibration: true
        });

        return true;
    } catch (error) {
        console.error('Local notifications init error:', error);
        return false;
    }
};

/**
 * Prosi o uprawnienia do powiadomień Web
 */
export const requestWebNotificationPermission = async (): Promise<boolean> => {
    if (!isWebNotificationSupported()) return false;

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Web notification permission error:', error);
        return false;
    }
};

/**
 * Planuje przypomnienie o powtórce SRS
 */
export const scheduleSRSReminder = async (
    topicCount: number,
    title?: string,
    body?: string,
    scheduledTime?: Date
): Promise<number | null> => {
    if (!isPushSupported()) return null;

    const notificationId = Date.now();
    const scheduleAt = scheduledTime || getDefaultReminderTime();

    try {
        await LocalNotifications.schedule({
            notifications: [{
                id: notificationId,
                title: title || '📚 Czas na powtórkę!',
                body: body || (topicCount === 1
                    ? '1 temat czeka na powtórzenie. Nie pozwól mu umknąć!'
                    : `${topicCount} tematów czeka na powtórzenie. Zacznij teraz!`),
                schedule: { at: scheduleAt },
                channelId: NOTIFICATION_CHANNEL_ID,
                extra: { category: 'srs_reminder', topicCount }
            }]
        });

        console.log(`📅 SRS reminder scheduled for ${scheduleAt.toISOString()}`);
        return notificationId;
    } catch (error) {
        console.error('Failed to schedule SRS reminder:', error);
        return null;
    }
};

/**
 * Planuje przypomnienie o serii (streak)
 */
export const scheduleStreakReminder = async (
    currentStreak: number,
    title?: string,
    body?: string
): Promise<number | null> => {
    if (!isPushSupported()) return null;

    const notificationId = Date.now() + 1;
    const scheduleAt = getEveningReminderTime(); // 20:00

    try {
        await LocalNotifications.schedule({
            notifications: [{
                id: notificationId,
                title: title || '🔥 Twoja seria jest zagrożona!',
                body: body || (currentStreak > 0
                    ? `Masz ${currentStreak}-dniową serię! Odpowiedz na kilka pytań, żeby jej nie stracić.`
                    : 'Zacznij nową serię nauki już dziś!'),
                schedule: { at: scheduleAt },
                channelId: NOTIFICATION_CHANNEL_ID,
                extra: { category: 'streak_warning', streak: currentStreak }
            }]
        });

        console.log(`📅 Streak reminder scheduled for ${scheduleAt.toISOString()}`);
        return notificationId;
    } catch (error) {
        console.error('Failed to schedule streak reminder:', error);
        return null;
    }
};

/**
 * Planuje przypomnienie o dziennym celu
 */
export const scheduleDailyGoalReminder = async (
    remainingXP: number,
    title?: string,
    body?: string
): Promise<number | null> => {
    if (!isPushSupported() || remainingXP <= 0) return null;

    const notificationId = Date.now() + 2;
    const scheduleAt = getAfternoonReminderTime(); // 16:00

    try {
        await LocalNotifications.schedule({
            notifications: [{
                id: notificationId,
                title: title || '🎯 Dzienny cel!',
                body: body || `Zostało Ci jeszcze ${remainingXP} XP do celu. Dasz radę!`,
                schedule: { at: scheduleAt },
                channelId: NOTIFICATION_CHANNEL_ID,
                extra: { category: 'daily_goal', remainingXP }
            }]
        });

        return notificationId;
    } catch (error) {
        console.error('Failed to schedule daily goal reminder:', error);
        return null;
    }
};

/**
 * Anuluje wszystkie zaplanowane powiadomienia
 */
export const cancelAllNotifications = async (): Promise<void> => {
    if (!isPushSupported()) return;

    try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({
                notifications: pending.notifications.map(n => ({ id: n.id }))
            });
            console.log('🗑️ All notifications cancelled');
        }
    } catch (error) {
        console.error('Failed to cancel notifications:', error);
    }
};

/**
 * Pokazuje natychmiastowe powiadomienie
 */
export const showInstantNotification = async (
    title: string,
    body: string,
    category: NotificationCategory = 'general'
): Promise<void> => {
    // 1. Spróbuj powiadomień natywnych (Capacitor)
    if (isPushSupported()) {
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    id: Date.now(),
                    title,
                    body,
                    schedule: { at: new Date(Date.now() + 1000) }, // Za 1 sekundę
                    channelId: NOTIFICATION_CHANNEL_ID,
                    extra: { category }
                }]
            });
            return;
        } catch (error) {
            console.error('Failed to show native instant notification:', error);
        }
    }

    // 2. Spróbuj powiadomień Web Notification API
    if (isWebNotificationSupported()) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, { body });
            }
        }
    }
};

// --- HELPER FUNCTIONS ---

function getDefaultReminderTime(): Date {
    const date = new Date();
    date.setHours(10, 0, 0, 0); // 10:00
    if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
    }
    return date;
}

function getEveningReminderTime(): Date {
    const date = new Date();
    date.setHours(20, 0, 0, 0); // 20:00
    if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
    }
    return date;
}

function getAfternoonReminderTime(): Date {
    const date = new Date();
    date.setHours(16, 0, 0, 0); // 16:00
    if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
    }
    return date;
}

// --- LISTENERY ---

/**
 * Ustawia listenery dla powiadomień push
 */
export const setupPushListeners = (
    onNotificationReceived?: (notification: PushNotificationSchema) => void,
    onNotificationAction?: (action: ActionPerformed) => void
): void => {
    if (!isPushSupported()) return;

    // Powiadomienie otrzymane gdy app jest w foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📬 Push received:', notification);
        onNotificationReceived?.(notification);
    });

    // Użytkownik kliknął powiadomienie
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('👆 Push action:', action);
        onNotificationAction?.(action);
    });
};

/**
 * Ustawia listenery dla powiadomień lokalnych
 */
export const setupLocalListeners = (
    onNotificationReceived?: (notification: LocalNotificationSchema) => void,
    onNotificationAction?: (action: any) => void
): void => {
    if (!isPushSupported()) return;

    LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('📬 Local notification received:', notification);
        onNotificationReceived?.(notification);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('👆 Local notification action:', action);
        onNotificationAction?.(action);
    });
};
