// src/services/clanService.ts
// Firebase service for clan management, chat, and rankings.

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    query,
    orderBy,
    limit,
    where
} from 'firebase/firestore';
import { ref, push, onChildAdded, off } from 'firebase/database';
import { db, rtdb } from '../components/firebaseConfig';
import { Clan, ClanMember, ClanChatMessage, TradeOffer } from '../types';
import { removeItem, adjustGems, grantItem, ITEMS_DB } from './inventoryService';

const TRADES_COLLECTION = 'trade_offers';

export const TEST_MODE = false; // <<< ZMIEŃ NA true ŻEBY WYŁĄCZYĆ WYMAGANIA

// =====================
// CREATE CLAN
// =====================
export async function createClan(
    userId: string,
    userName: string,
    userAvatar: string,
    userElo: number,
    userWins: number,
    userLosses: number,
    userGems: number,
    clanData: {
        name: string;
        avatar: string;
        isPublic: boolean;
        minElo: number;
        location?: { lat: number; lng: number };
    }
): Promise<{ success: boolean; error?: string; clanId?: string }> {
    // Validation
    if (!TEST_MODE && userElo < 100) {
        return { success: false, error: 'Potrzebujesz minimum 100 ELO, żeby stworzyć klan.' };
    }
    if (!TEST_MODE && userGems < 100) {
        return { success: false, error: 'Potrzebujesz minimum 100 kasztanów, żeby stworzyć klan.' };
    }
    if (!clanData.name.trim() || clanData.name.trim().length < 3) {
        return { success: false, error: 'Nazwa klanu musi mieć co najmniej 3 znaki.' };
    }
    if (clanData.name.trim().length > 24) {
        return { success: false, error: 'Nazwa klanu może mieć maksymalnie 24 znaki.' };
    }

    // Check if user already in a clan
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists() && userDoc.data()?.clanId) {
        return { success: false, error: 'Musisz opuścić obecny klan, żeby stworzyć nowy.' };
    }

    try {
        const clanRef = doc(collection(db, 'clans'));
        const clanId = clanRef.id;

        const winrate = userWins + userLosses > 0
            ? Math.round((userWins / (userWins + userLosses)) * 100)
            : 0;

        const leaderMember: ClanMember = {
            uid: userId,
            name: userName,
            avatar: userAvatar,
            elo: userElo,
            wins: userWins,
            losses: userLosses,
            joinedAt: Date.now(),
            role: 'leader'
        };

        const clanDoc: Omit<Clan, 'id'> = {
            name: clanData.name.trim(),
            avatar: clanData.avatar || '🏰',
            leaderId: userId,
            leaderName: userName,
            isPublic: clanData.isPublic,
            minElo: clanData.minElo,
            members: { [userId]: leaderMember },
            memberCount: 1,
            totalElo: userElo,
            averageWinrate: winrate,
            createdAt: Date.now(),
            ...(clanData.location ? { location: clanData.location } : {})
        };

        await setDoc(clanRef, clanDoc);

        // Update user document with clanId
        await updateDoc(doc(db, 'users', userId), { clanId });

        return { success: true, clanId };
    } catch (error) {
        console.error('Failed to create clan:', error);
        return { success: false, error: 'Nie udało się stworzyć klanu. Spróbuj ponownie.' };
    }
}

// =====================
// JOIN CLAN
// =====================
export async function joinClan(
    clanId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    userElo: number,
    userWins: number,
    userLosses: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const clanRef = doc(db, 'clans', clanId);
        const clanSnap = await getDoc(clanRef);

        if (!clanSnap.exists()) {
            return { success: false, error: 'Klan nie istnieje.' };
        }

        const clan = clanSnap.data() as Omit<Clan, 'id'>;

        if (!clan.isPublic) {
            return { success: false, error: 'Ten klan jest prywatny.' };
        }
        if (userElo < clan.minElo) {
            return { success: false, error: `Potrzebujesz minimum ${clan.minElo} ELO, żeby dołączyć.` };
        }
        if (clan.members[userId]) {
            return { success: false, error: 'Już jesteś w tym klanie.' };
        }

        // Check if user is already in another clan
        const userDocSnap = await getDoc(doc(db, 'users', userId));
        if (userDocSnap.exists() && userDocSnap.data()?.clanId) {
            return { success: false, error: 'Musisz opuścić obecny klan, żeby dołączyć do nowego.' };
        }

        const newMember: ClanMember = {
            uid: userId,
            name: userName,
            avatar: userAvatar,
            elo: userElo,
            wins: userWins,
            losses: userLosses,
            joinedAt: Date.now(),
            role: 'member'
        };

        // Recalculate stats
        const allMembers = { ...clan.members, [userId]: newMember };
        const memberArr = Object.values(allMembers);
        const totalElo = memberArr.reduce((sum, m) => sum + m.elo, 0);
        const avgWinrate = Math.round(
            memberArr.reduce((sum, m) => {
                const total = m.wins + m.losses;
                return sum + (total > 0 ? (m.wins / total) * 100 : 0);
            }, 0) / memberArr.length
        );

        await updateDoc(clanRef, {
            [`members.${userId}`]: newMember,
            memberCount: clan.memberCount + 1,
            totalElo,
            averageWinrate: avgWinrate
        });

        await updateDoc(doc(db, 'users', userId), { clanId });

        return { success: true };
    } catch (error) {
        console.error('Failed to join clan:', error);
        return { success: false, error: 'Nie udało się dołączyć do klanu.' };
    }
}

// =====================
// ADD FRIEND TO CLAN (Leader/Co-leader action)
// =====================
export async function addFriendToClan(
    clanId: string,
    friendUid: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const clanRef = doc(db, 'clans', clanId);
        const clanSnap = await getDoc(clanRef);

        if (!clanSnap.exists()) {
            return { success: false, error: 'Klan nie istnieje.' };
        }

        const clan = clanSnap.data() as Omit<Clan, 'id'>;

        // Verify if friend already in this clan
        if (clan.members[friendUid]) {
            return { success: false, error: 'Znajomy jest już w Twoim klanie.' };
        }

        // Check if friend is in another clan
        const friendDocSnap = await getDoc(doc(db, 'users', friendUid));
        if (friendDocSnap.exists() && friendDocSnap.data()?.clanId) {
            return { success: false, error: 'Ten znajomy należy już do innego klanu. Musi go najpierw opuścić.' };
        }

        // We need friend's current stats
        const friendData = friendDocSnap.data() || {};
        const stats = friendData.stats || {};

        // Use rankingService if needed, but for simplicity we can read from user document if stats.elo is there,
        // or just default it. For accuracy, let's fetch from rankings collection:
        const rankingDoc = await getDoc(doc(db, 'rankings', friendUid));
        const rData = rankingDoc.exists() ? rankingDoc.data() : { elo: 0, wins: 0, losses: 0 };

        const newMember: ClanMember = {
            uid: friendUid,
            name: stats.name || 'Znajomy',
            avatar: stats.avatar || '',
            elo: rData.elo || 0,
            wins: rData.wins || 0,
            losses: rData.losses || 0,
            joinedAt: Date.now(),
            role: 'member'
        };

        // Recalculate stats
        const allMembers = { ...clan.members, [friendUid]: newMember };
        const memberArr = Object.values(allMembers);
        const totalElo = memberArr.reduce((sum, m) => sum + m.elo, 0);
        const avgWinrate = Math.round(
            memberArr.reduce((sum, m) => {
                const total = m.wins + m.losses;
                return sum + (total > 0 ? (m.wins / total) * 100 : 0);
            }, 0) / memberArr.length
        );

        await updateDoc(clanRef, {
            [`members.${friendUid}`]: newMember,
            memberCount: clan.memberCount + 1,
            totalElo,
            averageWinrate: avgWinrate
        });

        // Set friend's clanId
        await updateDoc(doc(db, 'users', friendUid), { clanId });

        return { success: true };
    } catch (error) {
        console.error('Failed to add friend to clan:', error);
        return { success: false, error: 'Nie udało się dodać znajomego do klanu.' };
    }
}

// =====================
// LEAVE CLAN
// =====================
export async function leaveClan(
    clanId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const clanRef = doc(db, 'clans', clanId);
        const clanSnap = await getDoc(clanRef);

        if (!clanSnap.exists()) {
            return { success: false, error: 'Klan nie istnieje.' };
        }

        const clan = clanSnap.data() as Omit<Clan, 'id'>;

        // If leader, disband clan
        if (clan.leaderId === userId) {
            // Remove clanId from all members
            const memberIds = Object.keys(clan.members);
            await Promise.all(
                memberIds.map(uid => updateDoc(doc(db, 'users', uid), { clanId: deleteField() }))
            );
            await deleteDoc(clanRef);
            return { success: true };
        }

        // Regular member leaves
        const remainingMembers = { ...clan.members };
        delete remainingMembers[userId];

        const memberArr = Object.values(remainingMembers);
        const totalElo = memberArr.reduce((sum, m) => sum + m.elo, 0);
        const avgWinrate = memberArr.length > 0
            ? Math.round(
                memberArr.reduce((sum, m) => {
                    const total = m.wins + m.losses;
                    return sum + (total > 0 ? (m.wins / total) * 100 : 0);
                }, 0) / memberArr.length
            )
            : 0;

        await updateDoc(clanRef, {
            [`members.${userId}`]: deleteField(),
            memberCount: memberArr.length,
            totalElo,
            averageWinrate: avgWinrate
        });

        await updateDoc(doc(db, 'users', userId), { clanId: deleteField() });

        return { success: true };
    } catch (error) {
        console.error('Failed to leave clan:', error);
        return { success: false, error: 'Nie udało się opuścić klanu.' };
    }
}

// =====================
// GET USER'S CLAN
// =====================
export async function getUserClan(userId: string): Promise<Clan | null> {
    try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (!userSnap.exists()) return null;

        const clanId = userSnap.data()?.clanId;
        if (!clanId) return null;

        const clanSnap = await getDoc(doc(db, 'clans', clanId));
        if (!clanSnap.exists()) return null;

        return { id: clanSnap.id, ...clanSnap.data() } as Clan;
    } catch (error) {
        console.error('Failed to get user clan:', error);
        return null;
    }
}

// =====================
// GET PUBLIC CLANS
// =====================
export async function getPublicClans(): Promise<Clan[]> {
    try {
        const q = query(
            collection(db, 'clans'),
            where('isPublic', '==', true),
            orderBy('totalElo', 'desc'),
            limit(50)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Clan));
    } catch (error) {
        console.error('Failed to get public clans:', error);
        return [];
    }
}

// =====================
// GET CLAN RANKINGS (top clans by totalElo)
// =====================
export async function getClanRankings(): Promise<Clan[]> {
    try {
        const q = query(
            collection(db, 'clans'),
            orderBy('totalElo', 'desc'),
            limit(50)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Clan));
    } catch (error) {
        console.error('Failed to get clan rankings:', error);
        return [];
    }
}

// =====================
// GET ALL CLAN LOCATIONS (for map)
// =====================
export async function getClanLocations(): Promise<Clan[]> {
    try {
        const q = query(collection(db, 'clans'));
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Clan))
            .filter(c => c.location && c.location.lat && c.location.lng);
    } catch (error) {
        console.error('Failed to get clan locations:', error);
        return [];
    }
}

// =====================
// CLAN CHAT (using RTDB for real-time, low-cost reads)
// =====================
const CHAT_COOLDOWN_MS = 3000; // 3 seconds between messages
const chatCooldowns: Record<string, number> = {};

export async function sendClanMessage(
    clanId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    text: string
): Promise<{ success: boolean; error?: string }> {
    if (!text.trim()) return { success: false, error: 'Wiadomość nie może być pusta.' };
    if (text.trim().length > 200) return { success: false, error: 'Wiadomość może mieć maks. 200 znaków.' };

    // Rate limit check
    const now = Date.now();
    const lastSent = chatCooldowns[senderId] || 0;
    if (now - lastSent < CHAT_COOLDOWN_MS) {
        const remaining = Math.ceil((CHAT_COOLDOWN_MS - (now - lastSent)) / 1000);
        return { success: false, error: `Poczekaj ${remaining}s przed wysłaniem następnej wiadomości.` };
    }

    try {
        const chatRef = ref(rtdb, `clanChats/${clanId}`);
        await push(chatRef, {
            senderId,
            senderName,
            senderAvatar,
            text: text.trim(),
            timestamp: now
        });

        chatCooldowns[senderId] = now;
        return { success: true };
    } catch (error) {
        console.error('Failed to send clan message:', error);
        return { success: false, error: 'Nie udało się wysłać wiadomości.' };
    }
}

export function subscribeToClanChat(
    clanId: string,
    callback: (message: ClanChatMessage) => void
): () => void {
    const chatRef = ref(rtdb, `clanChats/${clanId}`);

    const handler = onChildAdded(chatRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback({
                id: snapshot.key || '',
                senderId: data.senderId,
                senderName: data.senderName,
                senderAvatar: data.senderAvatar,
                text: data.text,
                timestamp: data.timestamp
            });
        }
    });

    return () => off(chatRef, 'child_added', handler);
}

// ==========================================
// ALLIANCES (SOJUSZE)
// ==========================================

const ALLIANCES_COLLECTION = 'clan_alliances';

export const requestAlliance = async (senderClanId: string, targetClanId: string) => {
    try {
        const allianceId = `${senderClanId}_${targetClanId}`;
        const ref = doc(db, ALLIANCES_COLLECTION, allianceId);

        // Check if already exists or reverse exists
        const reverseRef = doc(db, ALLIANCES_COLLECTION, `${targetClanId}_${senderClanId}`);
        const [snap, reverseSnap] = await Promise.all([getDoc(ref), getDoc(reverseRef)]);

        if (snap.exists() || reverseSnap.exists()) {
            return { success: false, error: 'Zaproszenie już wysłane lub sojusz istnieje.' };
        }

        await setDoc(ref, {
            id: allianceId,
            clanIds: [senderClanId, targetClanId],
            status: 'pending',
            createdAt: Date.now()
        });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export const acceptAlliance = async (allianceId: string) => {
    try {
        const ref = doc(db, ALLIANCES_COLLECTION, allianceId);
        await updateDoc(ref, { status: 'active' });
        // NOTE: In a real app we might want to append this ID to both clans' 'allianceIds'
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

// ==========================================
// TRADING (HANDEL)
// ==========================================

export const createTradeOffer = async (senderId: string, senderClanId: string, priceGems: number, itemNames: string[]) => {
    try {
        const itemName = itemNames[0];
        const itemBase = Object.values(ITEMS_DB).find(i => i.name === itemName);
        if (!itemBase) return { success: false, error: 'Nie znaleziono przedmiotu.' };

        // 1. Deduct item from sender
        const removeRes = await removeItem(senderId, itemBase.id, 1);
        if (!removeRes.success) return removeRes;

        const tradeId = `trade_${Date.now()}_${senderId}`;
        const ref = doc(db, TRADES_COLLECTION, tradeId);

        await setDoc(ref, {
            id: tradeId,
            senderId,
            senderClanId,
            offer: { items: [itemName] },
            request: { gems: priceGems },
            status: 'open',
            createdAt: Date.now()
        });

        return { success: true, tradeId };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export const acceptTradeOffer = async (tradeId: string, recipientId: string) => {
    try {
        const ref = doc(db, TRADES_COLLECTION, tradeId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Nie znaleziono oferty.' };

        const data = snap.data() as TradeOffer;
        if (data.status !== 'open') return { success: false, error: 'Oferta jest już nieaktualna.' };
        if (data.senderId === recipientId) return { success: false, error: 'Nie możesz kupić własnej oferty!' };

        const price = data.request.gems;
        const itemName = data.offer.items[0];
        const itemBase = Object.values(ITEMS_DB).find(i => i.name === itemName);

        if (!itemBase) return { success: false, error: 'Błąd danych przedmiotu.' };

        // 1. Deduct gems from buyer
        const buyerGemRes = await adjustGems(recipientId, -price);
        if (!buyerGemRes.success) return buyerGemRes;

        // 2. Grant gems to seller
        await adjustGems(data.senderId, price);

        // 3. Grant item to buyer
        await grantItem(recipientId, itemBase.id, 'common', 1);

        // 4. Mark as completed
        await updateDoc(ref, {
            status: 'completed',
            recipientId
        });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export const getOpenTradeOffers = async (): Promise<TradeOffer[]> => {
    try {
        const q = query(
            collection(db, TRADES_COLLECTION),
            where('status', '==', 'open'),
            limit(50)
        );
        const snapshot = await getDocs(q);
        console.log(`[Trade] Fetched ${snapshot.size} open offers`);
        const offers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TradeOffer));

        // Sort in memory to avoid complex indices
        return offers.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Failed to get trade offers:', error);
        return [];
    }
};
