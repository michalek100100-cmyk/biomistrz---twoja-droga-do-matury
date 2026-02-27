import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ItemRarity } from '../types';
import { ITEMS_DB, getRarityColor, getRarityLabel } from '../services/inventoryService';
import { useLanguage } from '../contexts/LanguageContext';

interface ChestOpeningModalProps {
    chestId: string;
    reward: { baseId: string; rarity: ItemRarity };
    onClose: () => void;
}

const ChestOpeningModal: React.FC<ChestOpeningModalProps> = ({ chestId, reward, onClose }) => {
    const { t } = useLanguage();
    const [phase, setPhase] = useState<'closed' | 'shaking' | 'exploding' | 'revealed'>('closed');
    const chest = ITEMS_DB[chestId];
    const rewardItem = ITEMS_DB[reward.baseId];

    useEffect(() => {
        // Animation sequence
        const sequence = async () => {
            await new Promise(r => setTimeout(r, 500));
            setPhase('shaking');
            await new Promise(r => setTimeout(r, 1500));
            setPhase('exploding');
            await new Promise(r => setTimeout(r, 500));
            setPhase('revealed');
        };
        sequence();
    }, []);

    if (!chest || !rewardItem) return null;

    const rarityColor = getRarityColor(reward.rarity);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden">
            {/* Dark Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />

            {/* Light Rays Background */}
            {(phase === 'exploding' || phase === 'revealed') && (
                <>
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.4, scale: 2, rotate: 360 }}
                        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                        className="absolute w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] blur-3xl rounded-full"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.2, scale: 1.5, rotate: -360 }}
                        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                        className="absolute w-[600px] h-[600px] border border-white/10 rounded-full"
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {/* Phase: Closed & Shaking */}
                    {(phase === 'closed' || phase === 'shaking') && (
                        <motion.div
                            key="chest"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                x: phase === 'shaking' ? [0, -10, 10, -10, 10, 0] : 0,
                                rotate: phase === 'shaking' ? [0, -5, 5, -5, 5, 0] : 0
                            }}
                            transition={{
                                x: { repeat: Infinity, duration: 0.2 },
                                rotate: { repeat: Infinity, duration: 0.2 },
                                scale: { type: 'spring', damping: 15 }
                            }}
                            exit={{ scale: 1.5, opacity: 0, filter: 'brightness(5)' }}
                            className="text-[120px] drop-shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                        >
                            {chest.icon}
                        </motion.div>
                    )}

                    {/* Phase: Exploding */}
                    {phase === 'exploding' && (
                        <motion.div
                            key="explosion"
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 10, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="w-20 h-20 bg-white rounded-full blur-2xl"
                        />
                    )}

                    {/* Phase: Revealed */}
                    {phase === 'revealed' && (
                        <motion.div
                            key="reward"
                            initial={{ scale: 0.2, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 12 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative mb-8">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: 360
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className={`absolute -inset-12 blur-2xl opacity-40 rounded-full ${rarityColor.split(' ')[2]}`}
                                />
                                <div className="text-[140px] relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                                    <Sparkles className="absolute -top-8 -right-8 w-16 h-16 text-yellow-400 animate-pulse" />
                                    {rewardItem.icon}
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-center space-y-2"
                            >
                                <p className="text-white text-sm font-black uppercase tracking-[0.3em] opacity-60">{t.rewards.newItem}</p>
                                <h3 className="text-3xl font-black text-white stats-font px-4">{t.items[reward.baseId]?.name || rewardItem.name}</h3>
                                <div className={`inline-block px-3 py-1 rounded-full border-2 font-black text-xs uppercase tracking-widest ${rarityColor}`}>
                                    {(t.rarity as any)[reward.rarity] || getRarityLabel(reward.rarity)}
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                onClick={onClose}
                                className="mt-12 px-8 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                {t.common.confirm}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Particle Effects */}
            {phase === 'revealed' && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: '50%',
                                y: '50%',
                                opacity: 1,
                                scale: 0
                            }}
                            animate={{
                                x: `${50 + (Math.random() - 0.5) * 80}%`,
                                y: `${50 + (Math.random() - 0.5) * 80}%`,
                                opacity: 0,
                                scale: Math.random() + 0.5
                            }}
                            transition={{
                                duration: 2 + Math.random(),
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                            className="absolute w-2 h-2 bg-white rounded-full"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChestOpeningModal;
