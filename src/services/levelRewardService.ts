import { db } from '../components/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserStats, ItemRarity } from '../types';
import { grantItem } from './inventoryService';
import { xpToLevel } from './rankingService';

export const REWARD_MILESTONE_INTERVAL = 3;

/**
 * Zwraca poziom następnego kamienia milowego (nagrody)
 * Np. dla levela 1 -> 3, dla 3 -> 6, dla 7 -> 9
 */
export const getNextMilestoneLevel = (currentLevel: number): number => {
    return Math.ceil((currentLevel + 0.1) / REWARD_MILESTONE_INTERVAL) * REWARD_MILESTONE_INTERVAL;
};

/**
 * Oblicza wszystkie dotychczasowe poziomy nagród, których użytkownik jeszcze nie odebrał.
 */
export const getUnclaimedMilestones = (currentLevel: number, claimedMilestones: number[] = []): number[] => {
    const unclaimed: number[] = [];

    // Zbieraj wszystkie miltrokrotności 3, aż do obecnego poziomu gracza
    for (let lvl = REWARD_MILESTONE_INTERVAL; lvl <= currentLevel; lvl += REWARD_MILESTONE_INTERVAL) {
        if (!claimedMilestones.includes(lvl)) {
            unclaimed.push(lvl);
        }
    }

    return unclaimed;
};

/**
 * Losuje rzadkość przedmiotu ze skrzyni. 
 * Szanse można modyfikować według potrzeb balansowania.
 */
const rollRandomRarity = (): ItemRarity => {
    const roll = Math.random() * 100;
    if (roll < 5) return 'mythic';      // 5%
    if (roll < 15) return 'legendary';  // 10%
    if (roll < 35) return 'epic';       // 20%
    if (roll < 65) return 'rare';       // 30%
    return 'common';                    // 35%
};

/**
 * Odbiera nagrodę za dany (nieodebrany) próg poziomu.
 */
export const claimLevelReward = async (userId: string, targetLevel: number): Promise<{ success: boolean; itemGranted?: { baseId: string, rarity: ItemRarity }, error?: string }> => {
    try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);

        if (!snap.exists()) return { success: false, error: 'Użytkownik nie istnieje.' };

        const data = snap.data() as UserStats;
        const currentLevel = xpToLevel(data.xp);

        // 1. Sprawdź czy targetLevel został faktycznie odblokowany
        if (currentLevel < targetLevel) {
            return { success: false, error: 'Ten poziom nie został jeszcze zdobyty.' };
        }

        // 2. Sprawdź czy to poprawny krok (np. wielokrotność 3)
        if (targetLevel % REWARD_MILESTONE_INTERVAL !== 0) {
            return { success: false, error: 'Brak nagrody za podany poziom.' };
        }

        // 3. Sprawdź czy już nie został odebrany
        const claimed = data.claimedLevelRewards || [];
        if (claimed.includes(targetLevel)) {
            return { success: false, error: 'Ta nagroda została już odebrana.' };
        }

        // 4. Dolosowanie nagrody
        const itemsToPool = ['wool', 'magic_carrot'];
        const randomItem = itemsToPool[Math.floor(Math.random() * itemsToPool.length)];
        const rolledRarity = rollRandomRarity();

        // Przyznanie przedmiotu uzywajac istniejacego serwisu
        const grantRes = await grantItem(userId, randomItem, rolledRarity, 1);
        if (!grantRes.success) throw new Error(grantRes.error);

        // 5. Zapisanie odbioru
        claimed.push(targetLevel);
        await updateDoc(userRef, { claimedLevelRewards: claimed });

        return {
            success: true,
            itemGranted: { baseId: randomItem, rarity: rolledRarity }
        };

    } catch (e: any) {
        console.error("Failed to claim level reward:", e);
        return { success: false, error: e.message };
    }
};
