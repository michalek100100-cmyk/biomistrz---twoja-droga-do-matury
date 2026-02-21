// src/services/rankingService.ts
// ELO-based ranking system for 1v1 games

import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../components/firebaseConfig';

// --- TYPY ---

export interface PlayerRanking {
    elo: number;
    tier: RankTier;
    wins: number;
    losses: number;
    winStreak: number;
    bestStreak: number;
    lastMatch: string; // ISO date
    seasonGames: number;
}

export interface TopPlayer {
    userId: string;
    username: string;
    avatar?: string;
    elo: number;
    tier: RankTier;
    wins: number;
    losses: number;
}

export type RankTier =
    | 'bronze_3' | 'bronze_2' | 'bronze_1'
    | 'silver_3' | 'silver_2' | 'silver_1'
    | 'gold_3' | 'gold_2' | 'gold_1'
    | 'diamond_3' | 'diamond_2' | 'diamond_1'
    | 'master' | 'grandmaster';

export interface TierInfo {
    name: string;
    tier: RankTier;
    minElo: number;
    maxElo: number;
    color: string;
    bgColor: string;
    icon: string; // emoji
}

// --- STAŁE ---

export const INITIAL_ELO = 0;
export const K_FACTOR = 32; // Standard ELO K-factor

export const TIERS: TierInfo[] = [
    { name: 'Brąz III', tier: 'bronze_3', minElo: 0, maxElo: 799, color: 'text-orange-700', bgColor: 'bg-orange-900/30', icon: '🏆' },
    { name: 'Brąz II', tier: 'bronze_2', minElo: 800, maxElo: 899, color: 'text-orange-600', bgColor: 'bg-orange-800/30', icon: '🏆' },
    { name: 'Brąz I', tier: 'bronze_1', minElo: 900, maxElo: 999, color: 'text-orange-500', bgColor: 'bg-orange-700/30', icon: '🏆' },

    { name: 'Srebro III', tier: 'silver_3', minElo: 1000, maxElo: 1099, color: 'text-gray-400', bgColor: 'bg-gray-700/30', icon: '🏆' },
    { name: 'Srebro II', tier: 'silver_2', minElo: 1100, maxElo: 1199, color: 'text-gray-300', bgColor: 'bg-gray-600/30', icon: '🏆' },
    { name: 'Srebro I', tier: 'silver_1', minElo: 1200, maxElo: 1299, color: 'text-gray-200', bgColor: 'bg-gray-500/30', icon: '🏆' },

    { name: 'Złoto III', tier: 'gold_3', minElo: 1300, maxElo: 1399, color: 'text-yellow-500', bgColor: 'bg-yellow-900/30', icon: '🏆' },
    { name: 'Złoto II', tier: 'gold_2', minElo: 1400, maxElo: 1499, color: 'text-yellow-400', bgColor: 'bg-yellow-800/30', icon: '🏆' },
    { name: 'Złoto I', tier: 'gold_1', minElo: 1500, maxElo: 1599, color: 'text-yellow-300', bgColor: 'bg-yellow-700/30', icon: '🏆' },

    { name: 'Diament III', tier: 'diamond_3', minElo: 1600, maxElo: 1699, color: 'text-cyan-400', bgColor: 'bg-cyan-900/30', icon: '💎' },
    { name: 'Diament II', tier: 'diamond_2', minElo: 1700, maxElo: 1799, color: 'text-cyan-300', bgColor: 'bg-cyan-800/30', icon: '💎' },
    { name: 'Diament I', tier: 'diamond_1', minElo: 1800, maxElo: 1899, color: 'text-cyan-200', bgColor: 'bg-cyan-700/30', icon: '💎' },

    { name: 'Mistrz', tier: 'master', minElo: 1900, maxElo: 2099, color: 'text-purple-400', bgColor: 'bg-purple-900/30', icon: '👑' },
    { name: 'Arcymistrz', tier: 'grandmaster', minElo: 2100, maxElo: 9999, color: 'text-red-400', bgColor: 'bg-red-900/30', icon: '🏆' },
];

// --- FUNKCJE POMOCNICZE ---

/**
 * Oblicza tier na podstawie ELO
 */
export const getTierFromElo = (elo: number): TierInfo => {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (elo >= TIERS[i].minElo) {
            return TIERS[i];
        }
    }
    return TIERS[0];
};

/**
 * Oblicza progres do następnego tieru (0-100)
 */
export const getProgressToNextTier = (elo: number): number => {
    const currentTier = getTierFromElo(elo);
    const tierIndex = TIERS.findIndex(t => t.tier === currentTier.tier);

    // Jeśli już grandmaster, zawsze 100%
    if (tierIndex === TIERS.length - 1) return 100;

    const tierRange = currentTier.maxElo - currentTier.minElo + 1;
    const progress = elo - currentTier.minElo;

    return Math.min(100, Math.floor((progress / tierRange) * 100));
};

/**
 * Oblicza zmianę ELO na podstawie wyniku meczu
 * @param playerElo - ELO gracza
 * @param opponentElo - ELO przeciwnika
 * @param won - Czy gracz wygrał
 * @returns Zmiana ELO (może być ujemna)
 */
export const calculateEloChange = (
    playerElo: number,
    opponentElo: number,
    won: boolean
): number => {
    // Prawdopodobieństwo wygranej gracza wg. ELO
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

    // Rzeczywisty wynik (1 = wygrana, 0 = przegrana)
    const actualScore = won ? 1 : 0;

    // Zmiana ELO = K * (rzeczywisty - oczekiwany)
    const change = Math.round(K_FACTOR * (actualScore - expectedScore));

    return change;
};

/**
 * Pobiera ranking gracza z Firebase
 */
export const getPlayerRanking = async (userId: string): Promise<PlayerRanking> => {
    try {
        const rankingRef = doc(db, 'rankings', userId);
        const docSnap = await getDoc(rankingRef);

        if (docSnap.exists()) {
            return docSnap.data() as PlayerRanking;
        }

        // Nowy gracz - inicjalizuj ranking
        const initialRanking: PlayerRanking = {
            elo: INITIAL_ELO,
            tier: 'bronze_3',
            wins: 0,
            losses: 0,
            winStreak: 0,
            bestStreak: 0,
            lastMatch: new Date().toISOString(),
            seasonGames: 0
        };

        await setDoc(rankingRef, initialRanking);
        return initialRanking;
    } catch (error) {
        console.error('Failed to get player ranking:', error);
        // Fallback do domyślnego rankingu
        return {
            elo: INITIAL_ELO,
            tier: 'silver_3',
            wins: 0,
            losses: 0,
            winStreak: 0,
            bestStreak: 0,
            lastMatch: new Date().toISOString(),
            seasonGames: 0
        };
    }
};

/**
 * Aktualizuje ranking gracza po meczu 1v1
 */
export const updateRankingAfterMatch = async (
    userId: string,
    opponentElo: number,
    won: boolean
): Promise<{ newElo: number; eloChange: number; newTier: TierInfo }> => {
    try {
        const currentRanking = await getPlayerRanking(userId);
        let eloChange = calculateEloChange(currentRanking.elo, opponentElo, won);

        // Apply ELO buffs if won
        if (won && eloChange > 0) {
            try {
                const { getActiveBuffsClean } = await import('./inventoryService');
                const buffs = await getActiveBuffsClean(userId);
                const eloBuff = buffs.find(b => b.type === 'elo_multiplier');
                if (eloBuff) {
                    eloChange = Math.round(eloChange * eloBuff.multiplier);
                }
            } catch (e) {
                console.error("Failed to apply ELO buff", e);
            }
        }

        // Nie pozwól spaść poniżej 0 ELO
        const newElo = Math.max(0, currentRanking.elo + eloChange);
        const newTier = getTierFromElo(newElo);

        const newWinStreak = won ? currentRanking.winStreak + 1 : 0;
        const newBestStreak = Math.max(currentRanking.bestStreak, newWinStreak);

        const updatedRanking: PlayerRanking = {
            elo: newElo,
            tier: newTier.tier,
            wins: currentRanking.wins + (won ? 1 : 0),
            losses: currentRanking.losses + (won ? 0 : 1),
            winStreak: newWinStreak,
            bestStreak: newBestStreak,
            lastMatch: new Date().toISOString(),
            seasonGames: currentRanking.seasonGames + 1
        };

        const rankingRef = doc(db, 'rankings', userId);
        await setDoc(rankingRef, updatedRanking);

        console.log(`📊 Ranking updated: ${currentRanking.elo} → ${newElo} (${eloChange > 0 ? '+' : ''}${eloChange})`);

        // UPDATE: Synchronizacja z profilem gracza (kolekcja 'users')
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                'stats.elo': newElo
            });
            console.log("✅ Zaktualizowano ELO w profilu użytkownika");
        } catch (error) {
            console.error("❌ Błąd aktualizacji ELO w profilu użytkownika:", error);
        }

        return { newElo, eloChange, newTier };
    } catch (error) {
        console.error('Failed to update ranking:', error);
        throw error;
    }
};

/**
 * Formatuje zmianę ELO do wyświetlenia
 */
export const formatEloChange = (change: number): string => {
    if (change > 0) return `+${change}`;
    return `${change}`;
};

/**
 * Oblicza winrate gracza
 */
export const getWinrate = (wins: number, losses: number): number => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
};

/**
 * Pobiera TOP 3 graczy wg. ELO
 */
export const getTopPlayers = async (): Promise<TopPlayer[]> => {
    try {
        const rankingsRef = collection(db, 'rankings');
        const q = query(rankingsRef, orderBy('elo', 'desc'), limit(3));
        const querySnapshot = await getDocs(q);

        const topPlayers: TopPlayer[] = [];

        for (const docSnap of querySnapshot.docs) {
            const ranking = docSnap.data() as PlayerRanking;
            const userId = docSnap.id;

            // Pobierz dane użytkownika
            let username = 'Gracz';
            let avatar = undefined;

            try {
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    username = userData.username || userData.email?.split('@')[0] || 'Gracz';
                    avatar = userData.photoURL;
                }
            } catch (error) {
                console.warn('Failed to fetch user data for:', userId);
            }

            topPlayers.push({
                userId,
                username,
                avatar,
                elo: ranking.elo,
                tier: ranking.tier,
                wins: ranking.wins,
                losses: ranking.losses
            });
        }

        return topPlayers;
    } catch (error) {
        console.error('Failed to get top players:', error);
        return [];
    }
};

// --- XP TO LEVEL SYSTEM ---

export const XP_PER_LEVEL = 1000;

/**
 * Konwertuje XP na Level
 */
export const xpToLevel = (xp: number): number => {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
};

/**
 * Oblicza XP potrzebne do następnego levelu
 */
export const xpToNextLevel = (xp: number): number => {
    return XP_PER_LEVEL - (xp % XP_PER_LEVEL);
};

/**
 * Oblicza progres do następnego levelu (0-100)
 */
export const levelProgress = (xp: number): number => {
    return Math.floor((xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100);
};
