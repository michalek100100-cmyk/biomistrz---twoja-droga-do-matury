import { AdMob } from '@capacitor-community/admob';

// --- CONFIGURATION ---
const USE_TEST_ADS = false; // Change to false for production release

// Ad Unit IDs
const PROD_REWARDED_ID = 'ca-app-pub-8272345089531302/7032052718';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/1033173712';

// Active IDs
const REWARDED_ID = USE_TEST_ADS ? TEST_REWARDED_ID : PROD_REWARDED_ID;

import { Capacitor } from '@capacitor/core';

export const initializeAdMob = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await AdMob.initialize();
        console.log('AdMob initialized');
    } catch (e) {
        console.error('AdMob initialization failed', e);
    }
};

export const showRewardedAd = async (onReward: (reward: any) => void) => {
    if (!Capacitor.isNativePlatform()) {
        throw new Error('AdMob only works on native devices');
    }

    try {
        // Prepare (load) the ad first with a timeout
        const preparePromise = AdMob.prepareRewardVideoAd({
            adId: REWARDED_ID,
            isTesting: USE_TEST_ADS
        });

        // Timeout after 10 seconds if prepare doesn't resolve/reject
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Ad load timeout')), 10000)
        );

        await Promise.race([preparePromise, timeoutPromise]);

        // Show the ad
        const reward = await AdMob.showRewardVideoAd();

        if (reward) {
            onReward(reward);
        } else {
            throw new Error('No reward received');
        }
    } catch (e) {
        console.error('Failed to show rewarded ad:', e);
        throw e; // Re-throw so component can catch it
    }
};
