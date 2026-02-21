// src/components/UpdateRequiredScreen.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, AlertTriangle, X } from 'lucide-react';
import { VersionConfig } from '../services/versionService';
import { Capacitor } from '@capacitor/core';

interface UpdateRequiredScreenProps {
    config: VersionConfig;
    isRequired: boolean;
    onDismiss?: () => void;
}

const UpdateRequiredScreen: React.FC<UpdateRequiredScreenProps> = ({ config, isRequired, onDismiss }) => {
    const platform = Capacitor.getPlatform();

    const handleUpdate = () => {
        const url = platform === 'ios' ? config.appStoreUrl : config.playStoreUrl;
        if (url) {
            window.open(url, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6"
        >
            {/* Close button (only if not required) */}
            {!isRequired && onDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            )}

            {/* Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 ${isRequired
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_0_40px_rgba(59,130,246,0.4)]'
                    }`}
            >
                {isRequired ? (
                    <AlertTriangle className="w-12 h-12 text-white" />
                ) : (
                    <Download className="w-12 h-12 text-white" />
                )}
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-center mb-4"
            >
                {isRequired ? 'Wymagana Aktualizacja' : 'Dostępna Aktualizacja!'}
            </motion.h1>

            {/* Message */}
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-center max-w-sm mb-8"
            >
                {config.updateMessage || (isRequired
                    ? 'Ta wersja aplikacji nie jest już wspierana. Zaktualizuj, aby kontynuować.'
                    : 'Nowa wersja BioMistrza jest już dostępna z nowymi funkcjami i poprawkami!'
                )}
            </motion.p>

            {/* Update button */}
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleUpdate}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${isRequired
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                    }`}
            >
                <Smartphone className="w-5 h-5" />
                {platform === 'ios' ? 'Otwórz App Store' : 'Otwórz Play Store'}
            </motion.button>

            {/* Later button (only if not required) */}
            {!isRequired && onDismiss && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={onDismiss}
                    className="mt-4 px-6 py-3 text-gray-400 hover:text-white font-medium transition-colors"
                >
                    Później
                </motion.button>
            )}

            {/* Version info */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="absolute bottom-8 text-xs text-gray-600"
            >
                Najnowsza wersja: {config.latestVersion}
            </motion.p>
        </motion.div>
    );
};

export default UpdateRequiredScreen;
