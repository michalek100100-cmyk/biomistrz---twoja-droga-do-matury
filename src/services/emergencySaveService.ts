// src/services/emergencySaveService.ts
// Service for emergency state saving before app refresh

const EMERGENCY_FLAG_KEY = 'biomistrz_emergency_refresh';
const EMERGENCY_SAVE_KEY = 'biomistrz_emergency_save';
const EMERGENCY_SAVE_EXPIRY_MS = 30000; // 30 seconds

export interface EmergencySaveData {
    timestamp: number;
    stats: any;
    quizProgress: any;
    settings: any;
}

/**
 * Save critical state before emergency refresh
 */
export function performEmergencySave(stats: any, quizProgress: any, settings: any): void {
    const saveData: EmergencySaveData = {
        timestamp: Date.now(),
        stats,
        quizProgress,
        settings
    };

    try {
        localStorage.setItem(EMERGENCY_SAVE_KEY, JSON.stringify(saveData));
        localStorage.setItem(EMERGENCY_FLAG_KEY, 'true');
        console.log('🚨 Emergency save completed');
    } catch (error) {
        console.error('❌ Emergency save failed:', error);
    }
}

/**
 * Check if there's a recent emergency save to restore
 */
export function getEmergencySave(): EmergencySaveData | null {
    try {
        const flag = localStorage.getItem(EMERGENCY_FLAG_KEY);
        if (flag !== 'true') return null;

        const savedData = localStorage.getItem(EMERGENCY_SAVE_KEY);
        if (!savedData) return null;

        const data: EmergencySaveData = JSON.parse(savedData);

        // Check if save is recent (within expiry time)
        if (Date.now() - data.timestamp > EMERGENCY_SAVE_EXPIRY_MS) {
            clearEmergencySave();
            return null;
        }

        return data;
    } catch (error) {
        console.error('❌ Error reading emergency save:', error);
        return null;
    }
}

/**
 * Clear emergency save data after successful restore
 */
export function clearEmergencySave(): void {
    localStorage.removeItem(EMERGENCY_FLAG_KEY);
    localStorage.removeItem(EMERGENCY_SAVE_KEY);
}

/**
 * Check if app was refreshed due to emergency
 */
export function wasEmergencyRefresh(): boolean {
    return localStorage.getItem(EMERGENCY_FLAG_KEY) === 'true';
}

/**
 * Trigger emergency refresh
 */
export function triggerEmergencyRefresh(stats: any, quizProgress: any, settings: any): void {
    performEmergencySave(stats, quizProgress, settings);
    window.location.reload();
}
