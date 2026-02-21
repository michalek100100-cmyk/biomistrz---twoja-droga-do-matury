import { db } from '../components/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BaseItem, InventoryItem, ActiveBuff, ItemRarity, UserStats } from '../types';

// ==========================================
// 1. ITEM REGISTRY
// ==========================================
export const ITEMS_DB: Record<string, BaseItem> = {
    'wool': {
        id: 'wool',
        name: 'Wełna',
        description: 'Zwiększa zdobywane doświadczenie (XP) po grze.',
        icon: '🧶',
        type: 'xp_multiplier',
        price: 50
    },
    'magic_carrot': {
        id: 'magic_carrot',
        name: 'Magiczna Marchewka',
        description: 'Zwiększa limit zdobywanego ELO za wygrane gry (do max 2.5x).',
        icon: '🥕',
        type: 'elo_multiplier',
        price: 150
    },
    'boss_tincture': {
        id: 'boss_tincture',
        name: 'Kasztańska Nalewka',
        description: 'Zwiększa obrażenia zadawane bossom klanowym (3x).',
        icon: '🍶',
        type: 'boss_damage_multiplier',
        price: 300
    },
    'bronze_chest': {
        id: 'bronze_chest',
        name: 'Brązowa Skrzynia',
        description: 'Zawiera losowe przedmioty (Głównie Zwykłe i Rzadkie).',
        icon: '📦',
        type: 'chest',
        price: 150
    },
    'silver_chest': {
        id: 'silver_chest',
        name: 'Srebrna Skrzynia',
        description: 'Zawiera cenniejsze przedmioty (Często Epickie).',
        icon: '🧳',
        type: 'chest',
        price: 400
    },
    'gold_chest': {
        id: 'gold_chest',
        name: 'Złota Skrzynia',
        description: 'Najwyższa szansa na Mityczne i Legendarne przedmioty.',
        icon: '💰',
        type: 'chest',
        price: 900
    },
    'level_chest': {
        id: 'level_chest',
        name: 'Skrzynia Poziomu',
        description: 'Nagroda za osiągnięcie poziomu!',
        icon: '🎁',
        type: 'chest'
    }
};

// ==========================================
// 2. LOOT TABLES
// ==========================================

interface LootPoolEntry {
    baseId: string;
    rarity: ItemRarity;
    weight: number;
}

const LOOT_POOLS: Record<string, LootPoolEntry[]> = {
    'bronze_chest': [
        { baseId: 'wool', rarity: 'common', weight: 50 },
        { baseId: 'wool', rarity: 'rare', weight: 15 },
        { baseId: 'magic_carrot', rarity: 'common', weight: 25 },
        { baseId: 'magic_carrot', rarity: 'rare', weight: 8 },
        { baseId: 'boss_tincture', rarity: 'common', weight: 2 }
    ],
    'silver_chest': [
        { baseId: 'wool', rarity: 'rare', weight: 30 },
        { baseId: 'wool', rarity: 'epic', weight: 10 },
        { baseId: 'magic_carrot', rarity: 'rare', weight: 25 },
        { baseId: 'magic_carrot', rarity: 'epic', weight: 8 },
        { baseId: 'boss_tincture', rarity: 'rare', weight: 20 },
        { baseId: 'boss_tincture', rarity: 'epic', weight: 5 },
        { baseId: 'bronze_chest', rarity: 'common', weight: 2 }
    ],
    'gold_chest': [
        { baseId: 'magic_carrot', rarity: 'epic', weight: 30 },
        { baseId: 'magic_carrot', rarity: 'legendary', weight: 10 },
        { baseId: 'magic_carrot', rarity: 'mythic', weight: 2 },
        { baseId: 'boss_tincture', rarity: 'epic', weight: 25 },
        { baseId: 'boss_tincture', rarity: 'legendary', weight: 15 },
        { baseId: 'boss_tincture', rarity: 'mythic', weight: 3 },
        { baseId: 'silver_chest', rarity: 'common', weight: 15 }
    ]
};

const getRandomFromPool = (pool: LootPoolEntry[]): LootPoolEntry => {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let random = Math.random() * totalWeight;

    for (const entry of pool) {
        if (random < entry.weight) return entry;
        random -= entry.weight;
    }
    return pool[0];
};

// Internal multiplier map based on rarity
const RARITY_MULTIPLIERS = {
    common: 1.2,
    rare: 1.5,
    epic: 1.8,
    legendary: 2.2,
    mythic: 2.5
};

// Internal duration map based on rarity (in minutes)
const RARITY_DURATIONS_MINUTES = {
    common: 10,
    rare: 20,
    epic: 30,
    legendary: 60,
    mythic: 120
};

// Color mapping for UI elements matching rarity
export const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
        case 'common': return 'text-gray-400 border-gray-600 bg-gray-800';
        case 'rare': return 'text-blue-400 border-blue-600 bg-blue-900/30';
        case 'epic': return 'text-purple-400 border-purple-600 bg-purple-900/30';
        case 'legendary': return 'text-orange-400 border-orange-500 bg-orange-900/30';
        case 'mythic': return 'text-rose-400 border-rose-500 bg-rose-900/30';
    }
};

export const getRarityLabel = (rarity: ItemRarity) => {
    switch (rarity) {
        case 'common': return 'Zwykły';
        case 'rare': return 'Rzadki';
        case 'epic': return 'Epicki';
        case 'legendary': return 'Legendarny';
        case 'mythic': return 'Mityczny';
    }
}

// ==========================================
// 2. INTERNAL HELPERS (NO DB CALLS)
// ==========================================

export const grantItemToArray = (inventory: InventoryItem[], baseId: string, rarity: ItemRarity, amount: number = 1): InventoryItem[] => {
    const newInventory = [...inventory];
    const existingIndex = newInventory.findIndex(i => i.baseId === baseId && i.rarity === rarity);

    if (existingIndex !== -1) {
        newInventory[existingIndex].amount += amount;
    } else {
        newInventory.push({
            instanceId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            baseId,
            rarity,
            amount
        });
    }
    return newInventory;
};

// ==========================================
// 3. BACKEND LOGIC
// ==========================================

export const grantItem = async (userId: string, baseId: string, rarity: ItemRarity, amount: number = 1): Promise<{ success: boolean; error?: string }> => {
    try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Nie znaleziono użytkownika.' };

        const data = snap.data();
        const currentInventory: InventoryItem[] = data.inventory || [];

        const updatedInventory = grantItemToArray(currentInventory, baseId, rarity, amount);

        await updateDoc(ref, { inventory: updatedInventory });
        return { success: true };
    } catch (e: any) {
        console.error("Failed to grant item:", e);
        return { success: false, error: e.message };
    }
};

export const useItem = async (userId: string, instanceId: string): Promise<{ success: boolean; error?: string; reward?: { baseId: string; rarity: ItemRarity } }> => {
    try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Nie znaleziono użytkownika.' };

        const data = snap.data();
        let currentInventory: InventoryItem[] = data.inventory || [];
        let activeBuffs: ActiveBuff[] = data.activeBuffs || [];

        const itemIndex = currentInventory.findIndex(i => i.instanceId === instanceId);
        if (itemIndex === -1) return { success: false, error: 'Przedmiot nie istnieje w ekwipunku.' };

        const item = currentInventory[itemIndex];
        const baseItem = ITEMS_DB[item.baseId];

        if (!baseItem) return { success: false, error: 'Nieznany typ przedmiotu.' };
        // 0. Special case: Chest Opening
        if (baseItem.type === 'chest') {
            const pool = LOOT_POOLS[baseItem.id];
            if (!pool) return { success: false, error: 'Błąd konfiguracji skrzyni.' };

            const reward = getRandomFromPool(pool);

            // 1. Consume chest locally
            let updatedInventory = [...currentInventory];
            if (updatedInventory[itemIndex].amount > 1) {
                updatedInventory[itemIndex].amount -= 1;
            } else {
                updatedInventory.splice(itemIndex, 1);
            }

            // 2. Grant reward locally (Avoids race condition!)
            updatedInventory = grantItemToArray(updatedInventory, reward.baseId, reward.rarity, 1);

            // 3. Save everything in ONE DB call
            await updateDoc(ref, { inventory: updatedInventory });

            return { success: true, reward: { baseId: reward.baseId, rarity: reward.rarity } };
        }

        // 1. Calculate the buff
        let multiplier = RARITY_MULTIPLIERS[item.rarity];

        // Special case: Boss Tincture always gives 3x damage as per requirement
        if (baseItem.type === 'boss_damage_multiplier') {
            multiplier = 3.0;
        }

        const durationMinutes = RARITY_DURATIONS_MINUTES[item.rarity];
        const expiresAt = Date.now() + durationMinutes * 60 * 1000;

        // Check if a buff of the SAME TYPE already exists (we might want to replace or forbid stacking)
        // For simplicity: replace if the new one is better or lasts longer, else forbid.
        // Or even simpler: just overwrite the existing buff of that type.
        const existingBuffIndex = activeBuffs.findIndex(b => b.type === baseItem.type);

        const newBuff: ActiveBuff = {
            id: `buff_${Date.now()}`,
            type: baseItem.type as any,
            multiplier,
            expiresAt,
            sourceItemName: `${getRarityLabel(item.rarity)} ${baseItem.name}`
        };

        if (existingBuffIndex !== -1) {
            // Overwrite
            activeBuffs[existingBuffIndex] = newBuff;
        } else {
            activeBuffs.push(newBuff);
        }

        // 2. Consume the item
        if (item.amount > 1) {
            currentInventory[itemIndex].amount -= 1;
        } else {
            currentInventory.splice(itemIndex, 1);
        }

        await updateDoc(ref, {
            inventory: currentInventory,
            activeBuffs
        });

        return { success: true };
    } catch (e: any) {
        console.error("Failed to use item:", e);
        return { success: false, error: e.message };
    }
};

// Helper function to remove expired buffs, should be called before checking multipliers 
// or periodically when loading UI to reflect actual state.
export const getActiveBuffsClean = async (userId: string): Promise<ActiveBuff[]> => {
    try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return [];

        const data = snap.data() as UserStats;
        const buffs = data.activeBuffs || [];
        const now = Date.now();

        const validBuffs = buffs.filter(b => b.expiresAt > now);

        // If count differs, update DB to clean up
        if (validBuffs.length !== buffs.length) {
            await updateDoc(ref, { activeBuffs: validBuffs });
        }

        return validBuffs;
    } catch (e) {
        console.error("Failed to get active buffs:", e);
        return [];
    }
};

export const buyItem = async (userId: string, baseId: string, rarity: ItemRarity = 'common'): Promise<{ success: boolean; error?: string }> => {
    try {
        const item = ITEMS_DB[baseId];
        if (!item || !item.price) return { success: false, error: 'Przedmiot nie jest na sprzedaż.' };

        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Nie znaleziono użytkownika.' };

        const data = snap.data() as UserStats;
        if (data.gems < item.price) return { success: false, error: 'Masz za mało kasztanów!' };

        // 1. Deduct gems
        await updateDoc(ref, { gems: data.gems - item.price });

        // 2. Grant item
        const grantResult = await grantItem(userId, baseId, rarity, 1);
        if (!grantResult.success) {
            // Rollback gems if possible? (Simpler: just alert error)
            return grantResult;
        }

        return { success: true };
    } catch (e: any) {
        console.error("Failed to buy item:", e);
        return { success: false, error: e.message };
    }
};

export const removeItem = async (userId: string, baseId: string, amount: number = 1): Promise<{ success: boolean; error?: string }> => {
    try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Nie znaleziono użytkownika.' };

        const data = snap.data();
        let currentInventory: InventoryItem[] = data.inventory || [];

        const itemIndex = currentInventory.findIndex(i => i.baseId === baseId);
        if (itemIndex === -1 || currentInventory[itemIndex].amount < amount) {
            return { success: false, error: 'Nie masz wystarczającej ilości tego przedmiotu.' };
        }

        if (currentInventory[itemIndex].amount > amount) {
            currentInventory[itemIndex].amount -= amount;
        } else {
            currentInventory.splice(itemIndex, 1);
        }

        await updateDoc(ref, { inventory: currentInventory });
        return { success: true };
    } catch (e: any) {
        console.error("Failed to remove item:", e);
        return { success: false, error: e.message };
    }
};

export const adjustGems = async (userId: string, amount: number): Promise<{ success: boolean; error?: string }> => {
    try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Nie znaleziono użytkownika.' };

        const data = snap.data();
        const currentGems = data.gems || 0;

        if (currentGems + amount < 0) {
            return { success: false, error: 'Niewystarczająca ilość kasztanów!' };
        }

        await updateDoc(ref, { gems: currentGems + amount });
        return { success: true };
    } catch (e: any) {
        console.error("Failed to adjust gems:", e);
        return { success: false, error: e.message };
    }
};

export const getInventory = async (userId: string): Promise<InventoryItem[]> => {
    try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (!snap.exists()) return [];
        return (snap.data() as UserStats).inventory || [];
    } catch (e) {
        console.error("Failed to get inventory:", e);
        return [];
    }
};
