// src/components/FriendsSection.tsx
// Friends panel with search, friends list, and 1v1 invite
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    UserPlus,
    UserMinus,
    Loader2,
    X,
    UserCheck,
    Frown,
    Swords
} from 'lucide-react';
import {
    searchUsersByName,
    sendFriendRequest,
    removeFriend,
    subscribeFriends,
    isFriend,
    Friend,
    UserSearchResult
} from '../services/friendsService';
import { xpToLevel } from '../services/rankingService';

interface FriendsSectionProps {
    userId: string;
    userName: string;
    userAvatar: string;
    onInviteSent: (inviteId: string, friendName: string) => void;
}

const FriendsSection: React.FC<FriendsSectionProps> = ({
    userId,
    userName,
    userAvatar,
    onInviteSent
}) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [friendStatuses, setFriendStatuses] = useState<Record<string, boolean | 'pending'>>({});
    const [showSearch, setShowSearch] = useState(false);
    const [invitingFriend, setInvitingFriend] = useState<string | null>(null);

    // Subscribe to friends list
    useEffect(() => {
        if (!userId) return;

        const unsubscribe = subscribeFriends(userId, (updatedFriends) => {
            setFriends(updatedFriends);
        });

        return () => unsubscribe();
    }, [userId]);

    // Search with debounce
    useEffect(() => {
        if (!searchTerm.trim() || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchUsersByName(searchTerm, userId);
            setSearchResults(results);

            // Check friend status for each result
            const statuses: Record<string, boolean> = {};
            for (const user of results) {
                statuses[user.uid] = await isFriend(userId, user.uid);
            }
            setFriendStatuses(statuses);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, userId]);

    const handleAddFriend = async (friendUid: string) => {
        setIsAdding(friendUid);
        const requestId = await sendFriendRequest(
            { uid: userId, name: userName, avatar: userAvatar },
            friendUid
        );
        if (requestId) {
            // Show "request sent" status instead of "friend"
            setFriendStatuses(prev => ({ ...prev, [friendUid]: 'pending' as any }));
        }
        setIsAdding(null);
    };

    const handleRemoveFriend = async (friendUid: string) => {
        const confirmed = window.confirm('Czy na pewno chcesz usunąć znajomego?');
        if (!confirmed) return;

        setIsAdding(friendUid);
        const success = await removeFriend(userId, friendUid);
        if (success) {
            setFriendStatuses(prev => ({ ...prev, [friendUid]: false }));
        }
        setIsAdding(null);
    };

    const handleInviteTo1v1 = async (friend: Friend) => {
        setInvitingFriend(friend.uid);

        // Import dynamically to avoid circular deps
        const { createGameInvite } = await import('../services/gameInviteService');

        const inviteId = await createGameInvite(
            { uid: userId, name: userName, avatar: userAvatar },
            { uid: friend.uid, name: friend.name }
        );

        setInvitingFriend(null);
        onInviteSent(inviteId, friend.name);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto space-y-6 pb-32"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-800 ">Znajomi</h2>
                <p className="text-gray-400 text-sm">Zarządzaj swoją listą znajomych</p>
            </div>

            {/* Add Friend Toggle */}
            <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
                {showSearch ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {showSearch ? 'Zamknij wyszukiwarkę' : 'Dodaj znajomego'}
            </button>

            {/* Search Section */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white  rounded-2xl p-4 border border-gray-200  space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Wyszukaj po nicku..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50  border-2 border-gray-100  rounded-xl focus:border-blue-400 outline-none transition-colors font-medium text-gray-700 "
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                                )}
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-2">
                                        Wyniki ({searchResults.length})
                                    </p>
                                    {searchResults.map((user) => {
                                        const isAlreadyFriend = friendStatuses[user.uid];
                                        const isLoading = isAdding === user.uid;

                                        return (
                                            <motion.div
                                                key={user.uid}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-3 p-3 bg-gray-50  rounded-xl"
                                            >
                                                <img
                                                    src={user.avatar || `https://picsum.photos/seed/${user.name}/40/40`}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover bg-gray-200"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800  truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-400">Level {xpToLevel(user.xp)}</p>
                                                </div>
                                                {isAlreadyFriend === true ? (
                                                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                                                        <UserCheck className="w-4 h-4" />
                                                        <span>Znajomy</span>
                                                    </div>
                                                ) : friendStatuses[user.uid] === 'pending' ? (
                                                    <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                                                        <Loader2 className="w-4 h-4" />
                                                        <span>Wysłano</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddFriend(user.uid)}
                                                        disabled={isLoading}
                                                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                                        Zaproś
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* No results */}
                            {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
                                <div className="text-center py-6 text-gray-400">
                                    <Frown className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p className="font-medium">Nie znaleziono użytkowników</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Friends List */}
            <div className="bg-white  rounded-2xl border border-gray-200  overflow-hidden">
                <div className="px-4 py-3 bg-gray-50  border-b border-gray-200 ">
                    <h3 className="font-bold text-gray-800  flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Twoi znajomi ({friends.length})
                    </h3>
                </div>

                {friends.length > 0 ? (
                    <div className="divide-y divide-gray-100 ">
                        {friends.map((friend) => (
                            <motion.div
                                key={friend.uid}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 p-4 hover:bg-gray-50  transition-colors"
                            >
                                <img
                                    src={friend.avatar || `https://picsum.photos/seed/${friend.name}/40/40`}
                                    alt={friend.name}
                                    className="w-12 h-12 rounded-full object-cover bg-gray-200 border-2 border-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-800  truncate">{friend.name}</p>
                                    <p className="text-xs text-gray-400">
                                        Dodano {new Date(friend.addedAt).toLocaleDateString('pl-PL')}
                                    </p>
                                </div>

                                {/* Invite to 1v1 button */}
                                <button
                                    onClick={() => handleInviteTo1v1(friend)}
                                    disabled={invitingFriend === friend.uid}
                                    className="px-3 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-red-600 hover:to-orange-600 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-red-500/20"
                                    title="Zaproś do 1v1"
                                >
                                    {invitingFriend === friend.uid ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Swords className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">1v1</span>
                                </button>

                                <button
                                    onClick={() => handleRemoveFriend(friend.uid)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50  rounded-lg transition-colors"
                                    title="Usuń znajomego"
                                >
                                    <UserMinus className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <Users className="w-16 h-16 mx-auto text-gray-200  mb-4" />
                        <p className="text-gray-400 font-medium">Brak znajomych</p>
                        <p className="text-gray-300  text-sm mt-1">
                            Użyj wyszukiwarki, żeby dodać znajomych
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default FriendsSection;
