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
        type: 'xp_multiplier'
    },
    'magic_carrot': {
        id: 'magic_carrot',
        name: 'Magiczna Marchewka',
        description: 'Zwiększa limit zdobywanego ELO za wygrane gry (do max 2.5x).',
        icon: '🥕',
        type: 'elo_multiplier'
    }
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
// 2. BACKEND LOGIC
// ==========================================

export const grantItem = async (userId: string, baseId: string, rarity: ItemRarity, amount: number = 1): Promise<{ success: boolean; error?: string }> => {
    try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Nie znaleziono użytkownika.' };

        const data = snap.data();
        const currentInventory: InventoryItem[] = data.inventory || [];

        // Check if stack exists (same base item & rarity)
        const existingIndex = currentInventory.findIndex(i => i.baseId === baseId && i.rarity === rarity);

        if (existingIndex !== -1) {
            currentInventory[existingIndex].amount += amount;
        } else {
            currentInventory.push({
                instanceId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                baseId,
                rarity,
                amount
            });
        }

        await updateDoc(ref, { inventory: currentInventory });
        return { success: true };
    } catch (e: any) {
        console.error("Failed to grant item:", e);
        return { success: false, error: e.message };
    }
};

export const useItem = async (userId: string, instanceId: string): Promise<{ success: boolean; error?: string }> => {
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
        if (baseItem.type === 'other') return { success: false, error: 'Tego przedmiotu nie da się użyć jako wzmocnienia.' };

        // 1. Calculate the buff
        const multiplier = RARITY_MULTIPLIERS[item.rarity];
        const durationMinutes = RARITY_DURATIONS_MINUTES[item.rarity];
        const expiresAt = Date.now() + durationMinutes * 60 * 1000;

        // Check if a buff of the SAME TYPE already exists (we might want to replace or forbid stacking)
        // For simplicity: replace if the new one is better or lasts longer, else forbid.
        // Or even simpler: just overwrite the existing buff of that type.
        const existingBuffIndex = activeBuffs.findIndex(b => b.type === baseItem.type);

        const newBuff: ActiveBuff = {
            id: `buff_${Date.now()}`,
            type: baseItem.type,
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
