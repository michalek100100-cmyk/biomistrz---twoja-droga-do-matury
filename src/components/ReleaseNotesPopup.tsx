// src/components/ReleaseNotesPopup.tsx
// Popup showing release notes for new app versions
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Wrench, ChevronRight } from 'lucide-react';

interface ReleaseChange {
    type: 'new' | 'improved' | 'fixed';
    text: string;
}

interface ReleaseInfo {
    version: string;
    date: string;
    title: string;
    changes: ReleaseChange[];
}

interface ReleaseNotesData {
    currentVersion: string;
    releases: ReleaseInfo[];
}

const STORAGE_KEY = 'biomistrz_last_seen_version';

const ReleaseNotesPopup: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [releaseData, setReleaseData] = useState<ReleaseNotesData | null>(null);
    const [currentRelease, setCurrentRelease] = useState<ReleaseInfo | null>(null);

    useEffect(() => {
        const checkForNewVersion = async () => {
            try {
                // Fetch release notes from public folder
                const response = await fetch('/release-notes.json');
                if (!response.ok) return;

                const data: ReleaseNotesData = await response.json();
                setReleaseData(data);

                // Get last seen version from localStorage
                const lastSeenVersion = localStorage.getItem(STORAGE_KEY);

                // If no version seen yet or version is different, show popup
                if (!lastSeenVersion || lastSeenVersion !== data.currentVersion) {
                    const latestRelease = data.releases.find(r => r.version === data.currentVersion);
                    if (latestRelease) {
                        setCurrentRelease(latestRelease);
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch release notes:', error);
            }
        };

        // Small delay to let the app load first
        const timer = setTimeout(checkForNewVersion, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        if (releaseData) {
            localStorage.setItem(STORAGE_KEY, releaseData.currentVersion);
        }
        setIsVisible(false);
    };

    const getChangeIcon = (type: ReleaseChange['type']) => {
        switch (type) {
            case 'new':
                return <Sparkles className="w-4 h-4 text-green-500" />;
            case 'improved':
                return <Gift className="w-4 h-4 text-blue-500" />;
            case 'fixed':
                return <Wrench className="w-4 h-4 text-orange-500" />;
            default:
                return <ChevronRight className="w-4 h-4 text-gray-400" />;
        }
    };

    const getChangeLabel = (type: ReleaseChange['type']) => {
        switch (type) {
            case 'new':
                return 'Nowość';
            case 'improved':
                return 'Ulepszenie';
            case 'fixed':
                return 'Poprawka';
            default:
                return 'Zmiana';
        }
    };

    if (!currentRelease) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={handleDismiss}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-white  rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                            <button
                                onClick={handleDismiss}
                                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-purple-200">Aktualizacja</p>
                                    <h2 className="text-xl font-black">Wersja {currentRelease.version}</h2>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold">{currentRelease.title}</h3>
                            <p className="text-sm text-purple-200 mt-1">{currentRelease.date}</p>
                        </div>

                        {/* Changes List */}
                        <div className="p-6 max-h-[50vh] overflow-y-auto">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
                                Co nowego?
                            </h4>

                            <div className="space-y-3">
                                {currentRelease.changes.map((change, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-start gap-3 p-3 bg-gray-50  rounded-xl"
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {getChangeIcon(change.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-xs font-bold uppercase tracking-wide ${change.type === 'new' ? 'text-green-600 ' :
                                                change.type === 'improved' ? 'text-blue-600 ' :
                                                    'text-orange-600 '
                                                }`}>
                                                {getChangeLabel(change.type)}
                                            </span>
                                            <p className="text-sm text-gray-700  mt-0.5">
                                                {change.text}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0">
                            <button
                                onClick={handleDismiss}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-purple-200  hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95"
                            >
                                Super, zaczynamy! 🚀
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReleaseNotesPopup;
