import { UserStats, Achievement } from '../types';

export const INITIAL_ACHIEVEMENTS: Record<string, Achievement> = {
    nightOwl: {
        id: 'nightOwl',
        name: 'Nocny Marek',
        description: 'Ukończ test między godziną 00:00 a 03:00.',
        icon: '🦉',
        unlocked: false,
        progress: 0,
        target: 1,
        category: 'systematic',
        reward: { xp: 50, gems: 20 },
    },
    marathon: {
        id: 'marathon',
        name: 'Maratończyk',
        description: 'Odpowiedz na 100 pytań ogółem.',
        icon: '🏃',
        unlocked: false,
        progress: 0,
        target: 100,
        category: 'knowledge',
        reward: { xp: 100, gems: 50 },
    },
    streaker_bronze: {
        id: 'streaker_bronze',
        name: 'Żelazna Wola',
        description: 'Utrzymaj streak przez 3 dni.',
        icon: '🔥',
        unlocked: false,
        progress: 0,
        target: 3,
        category: 'systematic',
        reward: { xp: 50, gems: 20 },
    },
    investor: {
        id: 'investor',
        name: 'Inwestor',
        description: 'Zdobądź 1000 kasztanów w portfelu.',
        icon: '💰',
        unlocked: false,
        progress: 0,
        target: 1000,
        category: 'economy',
        reward: { xp: 100, gems: 0 },
    }
};

export type ValidAchievementEvent =
    | { type: 'QUIZ_FINISHED'; questionsAnswered: number }
    | { type: 'STREAK_UPDATED'; newStreak: number }
    | { type: 'GEMS_UPDATED'; currentGems: number }
    | { type: 'KALAMBURY_WIN' };

export interface AchievementCheckResult {
    newStats: UserStats;
    newlyUnlocked: Achievement[]; // Zwracamy listę tych, które się WŁAŚNIE odblokowały
}

export const checkAchievements = (stats: UserStats, event: ValidAchievementEvent): AchievementCheckResult => {
    // If user doesn't have achievements object yet, initialize it
    const achievements = stats.achievements || { ...INITIAL_ACHIEVEMENTS };
    const newlyUnlocked: Achievement[] = [];

    // Helper function to update progress
    const updateProgress = (id: string, newProgress: number) => {
        if (!achievements[id]) {
            // Jeśli jakoś nie ma tej odznaki w obiekcie, dodajmy ją z initial
            if (INITIAL_ACHIEVEMENTS[id]) {
                achievements[id] = { ...INITIAL_ACHIEVEMENTS[id] };
            } else return;
        }

        const ach = achievements[id];
        if (ach.unlocked) return; // Już odblokowane

        ach.progress = newProgress;

        if (ach.progress >= ach.target) {
            ach.unlocked = true;
            ach.unlockedAt = Date.now();
            ach.progress = ach.target;
            newlyUnlocked.push(ach);
        }
    };

    switch (event.type) {
        case 'QUIZ_FINISHED':
            // 1. Maratończyk
            updateProgress('marathon', achievements.marathon?.progress + event.questionsAnswered || event.questionsAnswered);

            // 2. Nocny Marek
            const hour = new Date().getHours();
            if (hour >= 0 && hour < 3) {
                updateProgress('nightOwl', 1);
            }
            break;

        case 'STREAK_UPDATED':
            updateProgress('streaker_bronze', event.newStreak);
            break;

        case 'GEMS_UPDATED':
            // Progress w inwestorze równy aktualnemu stanowi konta (lub max) - nie inkrementujemy, tylko 'setujemy'
            const highestGems = Math.max(achievements.investor?.progress || 0, event.currentGems);
            updateProgress('investor', highestGems);
            break;

        // tu możemy dodać więcej eventów
    }

    // Jeśli cokolwiek się odblokowało, dodajmy rewardy
    let earnedXp = 0;
    let earnedGems = 0;
    for (const unlocked of newlyUnlocked) {
        earnedXp += unlocked.reward.xp;
        earnedGems += unlocked.reward.gems;
    }

    return {
        newStats: {
            ...stats,
            achievements,
            xp: stats.xp + earnedXp,
            gems: stats.gems + earnedGems,
        },
        newlyUnlocked,
    };
};
