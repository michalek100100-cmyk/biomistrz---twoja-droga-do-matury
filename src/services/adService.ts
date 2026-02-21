import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// Test Ad Unit IDs from Google
const BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

export const initializeAdMob = async () => {
    try {
        await AdMob.initialize();
        console.log('AdMob initialized');
    } catch (e) {
        console.error('AdMob initialization failed', e);
    }
};

export const showBanner = async () => {
    try {
        await AdMob.showBanner({
            adId: BANNER_ID,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: true
        });
    } catch (e) {
        console.error('Failed to show banner', e);
    }
};

export const hideBanner = async () => {
    try {
        await AdMob.hideBanner();
        await AdMob.removeBanner();
    } catch (e) {
        console.error('Failed to hide banner', e);
    }
};

export const showRewardedAd = async (onReward: (reward: any) => void) => {
    try {
        // Prepare (load) the ad first
        await AdMob.prepareRewardVideoAd({
            adId: REWARDED_ID,
            isTesting: true
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
