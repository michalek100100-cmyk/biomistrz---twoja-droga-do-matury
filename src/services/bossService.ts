import { db } from '../components/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ClanBoss } from '../types';

const CLAN_BOSSES_COLLECTION = 'clan_bosses';

// Check and spawn a boss for the clan if none exists or if it expired
// For simplicity, we create a pseudo-random boss
export const spawnClanBossIfNeeded = async (clanId: string): Promise<ClanBoss | null> => {
    try {
        const ref = doc(db, CLAN_BOSSES_COLLECTION, clanId);
        const snap = await getDoc(ref);
        const now = Date.now();

        if (snap.exists()) {
            const data = snap.data() as ClanBoss;
            if (data.currentHp > 0 && data.activeUntil > now) {
                return data; // active boss exists
            }
        }

        // Spawn a new boss (valid for 24 hours)
        const bossNames = ["Zmutowany Wirus", "Bestia z Czarnobyla", "Goliat Botaniczny", "Król Grzybów"];
        const emojis = ["🦠", "🐉", "🌿", "🍄"];
        const rIndex = Math.floor(Math.random() * bossNames.length);

        const newBoss: ClanBoss = {
            id: `boss_${Date.now()}`,
            name: bossNames[rIndex],
            avatar: emojis[rIndex],
            maxHp: 20000,
            currentHp: 20000,
            activeUntil: now + 24 * 60 * 60 * 1000, // 24 hours
            participants: {},
            rewards: { gems: 500, elo: 50, loot: 'Skrzynia Bohatera' }
        };

        await setDoc(ref, newBoss);
        return newBoss;
    } catch (error) {
        console.error("Failed to spawn boss:", error);
        return null;
    }
};

// Listen to boss changes in real-time
export const subscribeToClanBoss = (clanId: string, onUpdate: (boss: ClanBoss | null) => void) => {
    const ref = doc(db, CLAN_BOSSES_COLLECTION, clanId);
    return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
            onUpdate(snap.data() as ClanBoss);
        } else {
            onUpdate(null);
        }
    });
};

// Attack the boss
export const attackClanBoss = async (clanId: string, userId: string, damage: number) => {
    try {
        const ref = doc(db, CLAN_BOSSES_COLLECTION, clanId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Brak aktywnego bossa.' };

        const data = snap.data() as ClanBoss;

        if (data.currentHp <= 0) return { success: false, error: 'Boss jest już pokonany!' };
        if (data.activeUntil < Date.now()) return { success: false, error: 'Boss uciekł!' };

        const newHp = Math.max(0, data.currentHp - damage);
        const currentDamage = data.participants[userId] || 0;
        const newParticipants = { ...data.participants, [userId]: currentDamage + damage };

        await updateDoc(ref, {
            currentHp: newHp,
            participants: newParticipants
        });

        // Trigger rewards distribution if the boss just died
        if (newHp === 0) {
            // In a real app, this should be a Cloud Function that securely distributes resources.
            // For now, players will claim it manually or we consider it "ready to claim".
            await updateDoc(ref, {
                status: 'defeated'
            });
        }

        return { success: true, damageDealt: damage, bossDead: newHp === 0 };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};
