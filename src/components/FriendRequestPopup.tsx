// src/components/FriendRequestPopup.tsx
// Popup for incoming friend requests
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Check, Loader2 } from 'lucide-react';
import {
    FriendRequest,
    subscribeToFriendRequests,
    acceptFriendRequest,
    declineFriendRequest
} from '../services/friendsService';

interface FriendRequestPopupProps {
    userId: string;
}

const FriendRequestPopup: React.FC<FriendRequestPopupProps> = ({ userId }) => {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = subscribeToFriendRequests(userId, (newRequests) => {
            setRequests(newRequests);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleAccept = async (requestId: string) => {
        setProcessingId(requestId);
        await acceptFriendRequest(requestId);
        setProcessingId(null);
    };

    const handleDecline = async (requestId: string) => {
        setProcessingId(requestId);
        await declineFriendRequest(requestId);
        setProcessingId(null);
    };

    if (requests.length === 0) return null;

    return (
        <AnimatePresence>
            {requests.map((request, index) => (
                <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: index * 90, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] z-[100]"
                    style={{ top: `${16 + index * 90}px` }}
                >
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <img
                                    src={request.fromUserAvatar || `https://picsum.photos/seed/${request.fromUserName}/48/48`}
                                    alt={request.fromUserName}
                                    className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                                />

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-white" />
                                        <span className="text-white font-bold">Zaproszenie do znajomych</span>
                                    </div>
                                    <p className="text-purple-100 text-sm">
                                        <span className="font-bold text-white">{request.fromUserName}</span> chce zostać Twoim znajomym
                                    </p>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => handleDecline(request.id)}
                                    disabled={processingId === request.id}
                                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {processingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <X className="w-4 h-4" />
                                    )}
                                    Odrzuć
                                </button>
                                <button
                                    onClick={() => handleAccept(request.id)}
                                    disabled={processingId === request.id}
                                    className="flex-1 py-2.5 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {processingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    Akceptuj
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    );
};

export default FriendRequestPopup;
