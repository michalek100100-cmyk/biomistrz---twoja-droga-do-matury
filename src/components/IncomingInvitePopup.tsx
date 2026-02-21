// src/components/IncomingInvitePopup.tsx
// Popup shown to recipient when receiving a game invite
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, X, Check, Clock } from 'lucide-react';
import {
    acceptGameInvite,
    declineGameInvite,
    GameInvite
} from '../services/gameInviteService';

interface IncomingInvitePopupProps {
    invite: GameInvite;
    onAccepted: (gameRoomId: string) => void;
    onClose: () => void;
}

const IncomingInvitePopup: React.FC<IncomingInvitePopupProps> = ({
    invite,
    onAccepted,
    onClose
}) => {
    const [isResponding, setIsResponding] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(
        Math.max(0, Math.ceil((invite.expiresAt - Date.now()) / 1000))
    );

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((invite.expiresAt - Date.now()) / 1000));
            setSecondsLeft(remaining);

            if (remaining <= 0) {
                onClose();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [invite.expiresAt, onClose]);

    const handleAccept = async () => {
        setIsResponding(true);
        const gameRoomId = await acceptGameInvite(invite.id);
        if (gameRoomId) {
            onAccepted(gameRoomId);
        } else {
            onClose();
        }
    };

    const handleDecline = async () => {
        setIsResponding(true);
        await declineGameInvite(invite.id);
        onClose();
    };

    const progressPercent = (secondsLeft / 30) * 100;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] z-[100]"
            >
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1.5 bg-blue-400/30">
                        <motion.div
                            className="h-full bg-white"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    <div className="p-4">
                        <div className="flex items-center gap-4 mb-4">
                            {/* Avatar */}
                            <img
                                src={invite.fromUserAvatar || `https://picsum.photos/seed/${invite.fromUserName}/48/48`}
                                alt={invite.fromUserName}
                                className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                            />

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Swords className="w-5 h-5 text-white" />
                                    <span className="text-white font-bold">Wyzwanie 1v1!</span>
                                </div>
                                <p className="text-blue-100 text-sm">
                                    <span className="font-bold text-white">{invite.fromUserName}</span> zaprasza Cię do gry
                                </p>
                            </div>

                            <div className="flex items-center gap-1 text-blue-200">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono font-bold">{secondsLeft}s</span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleDecline}
                                disabled={isResponding}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                                Odrzuć
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={isResponding}
                                className="flex-1 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Check className="w-5 h-5" />
                                Graj!
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default IncomingInvitePopup;
