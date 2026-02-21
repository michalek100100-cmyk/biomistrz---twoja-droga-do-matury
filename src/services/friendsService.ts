// src/services/friendsService.ts
// Firebase service for friends management with friend requests
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
    getDoc,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db } from '../components/firebaseConfig';

export interface Friend {
    uid: string;
    name: string;
    avatar: string;
    addedAt: number;
}

export interface UserSearchResult {
    uid: string;
    name: string;
    avatar: string;
    xp: number;
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar: string;
    toUserId: string;
    toUserName: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: number;
}

// Search users by name (partial match)
export async function searchUsersByName(searchTerm: string, currentUserId: string): Promise<UserSearchResult[]> {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];

    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        const results: UserSearchResult[] = [];
        const searchLower = searchTerm.toLowerCase();

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (docSnap.id === currentUserId) return;

            const stats = data.stats || {};
            const userName = (stats.name || '').toLowerCase();
            if (userName.includes(searchLower)) {
                results.push({
                    uid: docSnap.id,
                    name: stats.name || 'Użytkownik',
                    avatar: stats.avatar || '',
                    xp: stats.xp || 0
                });
            }
        });

        return results.slice(0, 10);
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

// Send a friend request
export async function sendFriendRequest(
    fromUser: { uid: string; name: string; avatar: string },
    toUserId: string
): Promise<string | null> {
    try {
        // Get target user's data
        const toUserDoc = await getDoc(doc(db, 'users', toUserId));
        if (!toUserDoc.exists()) return null;

        const toUserData = toUserDoc.data();
        const toUserStats = toUserData.stats || {};

        const requestId = `req_${fromUser.uid}_${toUserId}_${Date.now()}`;

        await setDoc(doc(db, 'friendRequests', requestId), {
            fromUserId: fromUser.uid,
            fromUserName: fromUser.name,
            fromUserAvatar: fromUser.avatar || '',
            toUserId: toUserId,
            toUserName: toUserStats.name || 'Użytkownik',
            status: 'pending',
            createdAt: Date.now()
        });

        return requestId;
    } catch (error) {
        console.error('Error sending friend request:', error);
        return null;
    }
}

// Accept a friend request (creates bidirectional friendship)
export async function acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
        const requestRef = doc(db, 'friendRequests', requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) return false;

        const request = requestDoc.data() as FriendRequest;
        if (request.status !== 'pending') return false;

        // Get both users' current data for fresh info
        const fromUserDoc = await getDoc(doc(db, 'users', request.fromUserId));
        const toUserDoc = await getDoc(doc(db, 'users', request.toUserId));

        const fromUserStats = fromUserDoc.exists() ? (fromUserDoc.data().stats || {}) : {};
        const toUserStats = toUserDoc.exists() ? (toUserDoc.data().stats || {}) : {};

        const now = Date.now();

        // Add friend for the person who sent the request (fromUser gets toUser as friend)
        await setDoc(doc(db, 'users', request.fromUserId, 'friends', request.toUserId), {
            uid: request.toUserId,
            name: toUserStats.name || request.toUserName,
            avatar: toUserStats.avatar || '',
            addedAt: now
        });

        // Add friend for the person who accepted (toUser gets fromUser as friend)
        await setDoc(doc(db, 'users', request.toUserId, 'friends', request.fromUserId), {
            uid: request.fromUserId,
            name: fromUserStats.name || request.fromUserName,
            avatar: fromUserStats.avatar || request.fromUserAvatar,
            addedAt: now
        });

        // Update request status
        await setDoc(requestRef, { ...request, status: 'accepted' }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error accepting friend request:', error);
        return false;
    }
}

// Decline a friend request
export async function declineFriendRequest(requestId: string): Promise<boolean> {
    try {
        const requestRef = doc(db, 'friendRequests', requestId);
        await deleteDoc(requestRef);
        return true;
    } catch (error) {
        console.error('Error declining friend request:', error);
        return false;
    }
}

// Subscribe to incoming friend requests
export function subscribeToFriendRequests(
    userId: string,
    callback: (requests: FriendRequest[]) => void
): Unsubscribe {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
        requestsRef,
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
        const requests: FriendRequest[] = [];
        snapshot.forEach((docSnap) => {
            requests.push({ id: docSnap.id, ...docSnap.data() } as FriendRequest);
        });
        // Sort by newest first
        requests.sort((a, b) => b.createdAt - a.createdAt);
        callback(requests);
    });
}

// Check if there's a pending request between users
export async function hasPendingRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    try {
        const requestsRef = collection(db, 'friendRequests');
        const q = query(
            requestsRef,
            where('fromUserId', '==', fromUserId),
            where('toUserId', '==', toUserId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking pending request:', error);
        return false;
    }
}

// Remove a friend (bidirectional removal)
export async function removeFriend(currentUserId: string, friendUid: string): Promise<boolean> {
    try {
        // Remove from current user's friends
        await deleteDoc(doc(db, 'users', currentUserId, 'friends', friendUid));
        // Remove from friend's friends (bidirectional)
        await deleteDoc(doc(db, 'users', friendUid, 'friends', currentUserId));
        return true;
    } catch (error) {
        console.error('Error removing friend:', error);
        return false;
    }
}

// Get friends list
export async function getFriends(currentUserId: string): Promise<Friend[]> {
    try {
        const friendsRef = collection(db, 'users', currentUserId, 'friends');
        const snapshot = await getDocs(friendsRef);

        const friends: Friend[] = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            friends.push({
                uid: data.uid,
                name: data.name,
                avatar: data.avatar,
                addedAt: data.addedAt
            });
        });

        return friends.sort((a, b) => b.addedAt - a.addedAt);
    } catch (error) {
        console.error('Error getting friends:', error);
        return [];
    }
}

// Check if user is already a friend
export async function isFriend(currentUserId: string, potentialFriendUid: string): Promise<boolean> {
    try {
        const friendRef = doc(db, 'users', currentUserId, 'friends', potentialFriendUid);
        const friendDoc = await getDoc(friendRef);
        return friendDoc.exists();
    } catch (error) {
        console.error('Error checking friend status:', error);
        return false;
    }
}

// Subscribe to friends list changes (real-time)
export function subscribeFriends(
    currentUserId: string,
    callback: (friends: Friend[]) => void
): Unsubscribe {
    const friendsRef = collection(db, 'users', currentUserId, 'friends');

    return onSnapshot(friendsRef, (snapshot) => {
        const friends: Friend[] = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            friends.push({
                uid: data.uid,
                name: data.name,
                avatar: data.avatar,
                addedAt: data.addedAt
            });
        });
        callback(friends.sort((a, b) => b.addedAt - a.addedAt));
    });
}
