// src/services/versionService.ts
// Service for checking app version against Firestore

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';

// Current app version - UPDATE THIS ON EACH RELEASE
export const APP_VERSION = '4.1.0';

export interface VersionConfig {
    latestVersion: string;
    minRequiredVersion: string;
    updateMessage: string;
    playStoreUrl: string;
    appStoreUrl: string;
}

export interface UpdateStatus {
    updateAvailable: boolean;
    updateRequired: boolean;
    config: VersionConfig | null;
}

/**
 * Compare two semantic version strings
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;

        if (numA < numB) return -1;
        if (numA > numB) return 1;
    }

    return 0;
}

/**
 * Fetch version config from Firestore
 */
export async function getRemoteVersionConfig(): Promise<VersionConfig | null> {
    try {
        const docRef = doc(db, 'config', 'appVersion');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as VersionConfig;
        }

        console.warn('⚠️ Version config document not found in Firestore');
        return null;
    } catch (error) {
        console.error('❌ Error fetching version config:', error);
        return null;
    }
}

/**
 * Check if update is available or required
 */
export async function checkForUpdate(): Promise<UpdateStatus> {
    const config = await getRemoteVersionConfig();

    if (!config) {
        return {
            updateAvailable: false,
            updateRequired: false,
            config: null
        };
    }

    const updateAvailable = compareVersions(APP_VERSION, config.latestVersion) < 0;
    const updateRequired = compareVersions(APP_VERSION, config.minRequiredVersion) < 0;

    return {
        updateAvailable,
        updateRequired,
        config
    };
}
