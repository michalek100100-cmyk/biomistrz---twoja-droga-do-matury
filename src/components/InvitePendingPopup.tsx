// src/components/InvitePendingPopup.tsx
// Popup shown to sender while waiting for invite acceptance
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Swords } from 'lucide-react';
import {
    subscribeToInvite,
    cancelGameInvite,
    cleanupExpiredInvite
} from '../services/gameInviteService';

interface InvitePendingPopupProps {
    inviteId: string;
    friendName: string;
    onAccepted: (gameRoomId: string) => void;
    onClose: () => void;
}

const TIMEOUT_SECONDS = 30;

const InvitePendingPopup: React.FC<InvitePendingPopupProps> = ({
    inviteId,
    friendName,
    onAccepted,
    onClose
}) => {
    const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
    const [status, setStatus] = useState<'pending' | 'accepted' | 'declined' | 'expired'>('pending');

    // Subscribe to invite status
    useEffect(() => {
        const unsubscribe = subscribeToInvite(inviteId, (invite) => {
            if (!invite) {
                // Invite was deleted
                setStatus('expired');
                return;
            }

            setStatus(invite.status);

            if (invite.status === 'accepted' && invite.gameRoomId) {
                onAccepted(invite.gameRoomId);
            }
        });

        return () => unsubscribe();
    }, [inviteId, onAccepted]);

    // Countdown timer
    useEffect(() => {
        if (status !== 'pending') return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    // Time's up - cleanup and close
                    cleanupExpiredInvite(inviteId);
                    setStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [status, inviteId]);

    // Auto-close on expired/declined after short delay
    useEffect(() => {
        if (status === 'expired' || status === 'declined') {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status, onClose]);

    const handleCancel = async () => {
        await cancelGameInvite(inviteId);
        onClose();
    };

    const progressPercent = (secondsLeft / TIMEOUT_SECONDS) * 100;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] z-[100]"
            >
                <div className="bg-white  rounded-2xl shadow-2xl border border-gray-200  overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-200 ">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            initial={{ width: '100%' }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>

                    <div className="p-4">
                        {status === 'pending' && (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100  rounded-xl flex items-center justify-center">
                                    <Swords className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 ">
                                        Zaproszenie wysłane
                                    </p>
                                    <p className="text-sm text-gray-500 ">
                                        Czekam na <span className="font-bold text-blue-500">{friendName}</span>...
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-mono font-bold">{secondsLeft}s</span>
                                    </div>
                                    <button
                                        onClick={handleCancel}
                                        className="p-2 hover:bg-gray-100  rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {status === 'declined' && (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100  rounded-xl flex items-center justify-center">
                                    <X className="w-6 h-6 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-red-600 ">
                                        Zaproszenie odrzucone
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {friendName} nie może teraz grać
                                    </p>
                                </div>
                            </div>
                        )}

                        {status === 'expired' && (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100  rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-600 ">
                                        Czas minął
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {friendName} nie odpowiedział
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InvitePendingPopup;
