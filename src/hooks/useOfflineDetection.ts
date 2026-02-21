// src/hooks/useOfflineDetection.ts
import { useState, useEffect } from 'react';

interface OfflineStatus {
    isOnline: boolean;
    wasOffline: boolean; // Was offline at some point during this session
}

/**
 * Hook to detect online/offline status
 * Returns current status and whether user was offline at any point
 */
export const useOfflineDetection = (): OfflineStatus => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            console.log('📶 Back online');
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            console.log('📵 Went offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, wasOffline };
};

export default useOfflineDetection;
