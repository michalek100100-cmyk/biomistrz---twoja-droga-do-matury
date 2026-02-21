// src/components/OfflineIndicator.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineIndicatorProps {
    isOnline: boolean;
    wasOffline: boolean;
}

/**
 * Shows a banner when offline, and a brief "back online" message when reconnecting
 */
const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline, wasOffline }) => {
    const [showReconnected, setShowReconnected] = React.useState(false);

    React.useEffect(() => {
        if (isOnline && wasOffline) {
            setShowReconnected(true);
            const timer = setTimeout(() => setShowReconnected(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white py-3 px-4 flex items-center justify-center gap-2 shadow-lg"
                >
                    <WifiOff className="w-5 h-5" />
                    <span className="font-bold text-sm">
                        Brak połączenia z internetem. Niektóre funkcje mogą być niedostępne.
                    </span>
                </motion.div>
            )}

            {showReconnected && isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-green-500 text-white py-3 px-4 flex items-center justify-center gap-2 shadow-lg"
                >
                    <Wifi className="w-5 h-5" />
                    <span className="font-bold text-sm">
                        Połączenie przywrócone! ✓
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineIndicator;
