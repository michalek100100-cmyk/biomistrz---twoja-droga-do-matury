import { AdMob } from '@capacitor-community/admob';

// --- CONFIGURATION ---
const USE_TEST_ADS = true; // Change to false for production release

// Ad Unit IDs
const PROD_REWARDED_ID = 'ca-app-pub-8272345089531302/7032052718';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/1033173712';

// Active IDs
const REWARDED_ID = USE_TEST_ADS ? TEST_REWARDED_ID : PROD_REWARDED_ID;

export const initializeAdMob = async () => {
    try {
        await AdMob.initialize();
        console.log('AdMob initialized');
    } catch (e) {
        console.error('AdMob initialization failed', e);
    }
};

export const showRewardedAd = async (onReward: (reward: any) => void) => {
    try {
        // Prepare (load) the ad first
        await AdMob.prepareRewardVideoAd({
            adId: REWARDED_ID,
            isTesting: USE_TEST_ADS
        });

        // Show the ad
        const reward = await AdMob.showRewardVideoAd();

        if (reward) {
            onReward(reward);
        }
    } catch (e) {
        console.error('Failed to show rewarded ad', e);
    }
};
