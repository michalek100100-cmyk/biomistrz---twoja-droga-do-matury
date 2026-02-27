// src/services/firebaseLimiterService.ts
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';

const QUOTA_LIMIT = 1000;
const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface QuotaData {
    count: number;
    resetAt: number;
}

/**
 * Service to limit Firebase writes to prevent abuse.
 * Uses a combination of localStorage for speed and Firestore for cross-device tracking.
 */
class FirebaseLimiterService {
    private localQuota: QuotaData | null = null;

    constructor() {
        this.loadLocalQuota();
    }

    private loadLocalQuota() {
        try {
            const saved = localStorage.getItem('fb_write_quota');
            if (saved) {
                this.localQuota = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load local quota', e);
        }
    }

    private saveLocalQuota(data: QuotaData) {
        this.localQuota = data;
        try {
            localStorage.setItem('fb_write_quota', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save local quota', e);
        }
    }

    /**
     * Checks if the user can perform a write.
     * @returns boolean true if write is allowed
     */
    async canWrite(userId: string): Promise<boolean> {
        const now = Date.now();

        // 1. Check local quota first for speed
        if (this.localQuota && now < this.localQuota.resetAt) {
            if (this.localQuota.count >= QUOTA_LIMIT) {
                console.warn('⚠️ Write quota exceeded (local check)');
                return false;
            }
        } else {
            // Reset local quota if window expired
            this.localQuota = { count: 0, resetAt: now + QUOTA_WINDOW_MS };
            this.saveLocalQuota(this.localQuota);
        }

        // 2. Check Firestore for authoritative quota
        try {
            const quotaRef = doc(db, 'quotas', userId);
            const quotaDoc = await getDoc(quotaRef);

            if (quotaDoc.exists()) {
                const data = quotaDoc.data();
                const resetAt = data.resetAt?.toMillis() || 0;

                if (now < resetAt) {
                    if (data.count >= QUOTA_LIMIT) {
                        // Sync local quota
                        this.saveLocalQuota({ count: data.count, resetAt });
                        console.warn('⚠️ Write quota exceeded (server check)');
                        return false;
                    }
                } else {
                    // Reset quota on server
                    await setDoc(quotaRef, {
                        count: 0,
                        resetAt: new Date(now + QUOTA_WINDOW_MS)
                    });
                }
            } else {
                // Initialize quota on server
                await setDoc(quotaRef, {
                    count: 0,
                    resetAt: new Date(now + QUOTA_WINDOW_MS)
                });
            }
        } catch (e) {
            console.error('Error checking quota from server, falling back to local', e);
        }

        return true;
    }

    /**
     * Records a write operation.
     */
    async recordWrite(userId: string) {
        // Update local
        if (this.localQuota) {
            this.localQuota.count++;
            this.saveLocalQuota(this.localQuota);
        }

        // Update server
        try {
            const quotaRef = doc(db, 'quotas', userId);
            await updateDoc(quotaRef, {
                count: increment(1)
            });
        } catch (e) {
            console.error('Failed to record write on server', e);
        }
    }
}

export const firebaseLimiter = new FirebaseLimiterService();
