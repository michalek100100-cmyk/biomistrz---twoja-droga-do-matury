// src/services/gameInviteService.ts
// Firebase service for friend game invites
import {
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    onSnapshot,
    Unsubscribe,
    updateDoc,
    collection,
    query,
    where
} from 'firebase/firestore';
import { db } from '../components/firebaseConfig';

export interface GameInvite {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar: string;
    toUserId: string;
    toUserName: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: number;
    expiresAt: number;
    gameRoomId?: string;
}

const INVITE_TIMEOUT_MS = 30000; // 30 seconds

// Create a game invite
export async function createGameInvite(
    fromUser: { uid: string; name: string; avatar: string },
    toUser: { uid: string; name: string }
): Promise<string> {
    const inviteId = `invite_${fromUser.uid}_${toUser.uid}_${Date.now()}`;
    const now = Date.now();

    const invite: Omit<GameInvite, 'id'> = {
        fromUserId: fromUser.uid,
        fromUserName: fromUser.name,
        fromUserAvatar: fromUser.avatar || '',
        toUserId: toUser.uid,
        toUserName: toUser.name,
        status: 'pending',
        createdAt: now,
        expiresAt: now + INVITE_TIMEOUT_MS
    };

    await setDoc(doc(db, 'gameInvites', inviteId), invite);
    return inviteId;
}

// Accept an invite - creates a Firebase lobby for both players
export async function acceptGameInvite(inviteId: string): Promise<string | null> {
    try {
        const inviteRef = doc(db, 'gameInvites', inviteId);
        const inviteDoc = await getDoc(inviteRef);

        if (!inviteDoc.exists()) return null;

        const invite = inviteDoc.data() as GameInvite;
        if (invite.status !== 'pending') return null;
        if (Date.now() > invite.expiresAt) {
            await deleteDoc(inviteRef);
            return null;
        }

        // Create a unique lobby ID for this friend game
        const lobbyId = `friend_${Date.now()}`;

        // Create the lobby document with both players
        const lobbyRef = doc(db, 'lobbies', lobbyId);
        await setDoc(lobbyRef, {
            id: lobbyId,
            hostId: invite.fromUserId,
            pin: 'FRIEND', // Special PIN for friend games
            status: 'LOBBY',
            isFriendGame: true, // Mark as non-ELO
            createdAt: Date.now(),
            players: {
                [invite.fromUserId]: {
                    uid: invite.fromUserId,
                    nick: invite.fromUserName,
                    avatar: invite.fromUserAvatar || '',
                    score: 0
                },
                [invite.toUserId]: {
                    uid: invite.toUserId,
                    nick: invite.toUserName,
                    avatar: '',
                    score: 0
                }
            }
        });

        // Update invite with lobby ID and accepted status
        await updateDoc(inviteRef, {
            status: 'accepted',
            gameRoomId: lobbyId
        });

        return lobbyId;
    } catch (error) {
        console.error('Error accepting invite:', error);
        return null;
    }
}

// Decline an invite
export async function declineGameInvite(inviteId: string): Promise<boolean> {
    try {
        const inviteRef = doc(db, 'gameInvites', inviteId);
        await updateDoc(inviteRef, { status: 'declined' });
        return true;
    } catch (error) {
        console.error('Error declining invite:', error);
        return false;
    }
}

// Cancel (delete) an invite (called by sender)
export async function cancelGameInvite(inviteId: string): Promise<boolean> {
    try {
        await deleteDoc(doc(db, 'gameInvites', inviteId));
        return true;
    } catch (error) {
        console.error('Error canceling invite:', error);
        return false;
    }
}

// Subscribe to invite status (for sender to know when accepted)
export function subscribeToInvite(
    inviteId: string,
    callback: (invite: GameInvite | null) => void
): Unsubscribe {
    const inviteRef = doc(db, 'gameInvites', inviteId);

    return onSnapshot(inviteRef, (docSnap) => {
        if (!docSnap.exists()) {
            callback(null);
            return;
        }
        callback({ id: docSnap.id, ...docSnap.data() } as GameInvite);
    });
}

// Subscribe to incoming invites for a user
export function subscribeToIncomingInvites(
    userId: string,
    callback: (invite: GameInvite | null) => void
): Unsubscribe {
    const invitesRef = collection(db, 'gameInvites');
    const q = query(
        invitesRef,
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            callback(null);
            return;
        }

        // Get the most recent pending invite
        const invites: GameInvite[] = [];
        snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            // Check if not expired
            if (Date.now() <= data.expiresAt) {
                invites.push({ id: docSnap.id, ...data } as GameInvite);
            }
        });

        if (invites.length > 0) {
            // Return the most recent invite
            invites.sort((a, b) => b.createdAt - a.createdAt);
            callback(invites[0]);
        } else {
            callback(null);
        }
    });
}

// Cleanup expired invite
export async function cleanupExpiredInvite(inviteId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'gameInvites', inviteId));
    } catch (error) {
        console.error('Error cleaning up invite:', error);
    }
}
