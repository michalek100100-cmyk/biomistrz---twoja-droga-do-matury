// src/components/SupportSection.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Coffee,
    Play,
    ExternalLink,
    ShieldCheck,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { showRewardedAd } from '../services/adService';
import { UserStats } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CurrencyTranslator } from '../services/CurrencyService';

interface SupportSectionProps {
    stats: UserStats;
    onUpdateStats: (newStats: UserStats) => void;
}

const SupportSection: React.FC<SupportSectionProps> = ({ stats, onUpdateStats }) => {
    const { t, language: lang } = useLanguage();
    const [isWatching, setIsWatching] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [adError, setAdError] = useState(false);

    const handleWatchAd = async () => {
        setIsWatching(true);
        setAdError(false);
        try {
            await showRewardedAd(() => {
                // Ad completed successfully
                const adValue = 0.02; // Updated from 0.05 PLN
                const newStats = {
                    ...stats,
                    supportValue: (stats.supportValue || 0) + adValue
                };
                onUpdateStats(newStats);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            });
        } catch (error) {
            console.error('Error watching ad:', error);
            setAdError(true);
            setTimeout(() => setAdError(false), 5000);
        } finally {
            setIsWatching(false);
        }
    };

    return (
        <div className="support-section space-y-6">
            {/* Header with Counter */}
            <div className="support-section-header relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white shadow-lg">
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="support-icon-wrapper w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                        <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
                    </div>
                    <h2 className="support-title text-2xl font-black mb-2">{t.support.title}</h2>
                    <div className="support-value-container flex items-baseline gap-1">
                        <span className="support-value text-4xl font-black">
                            {CurrencyTranslator.convert(stats.supportValue || 0, lang).value.toFixed(2)}
                        </span>
                        <span className="support-currency text-xl font-bold opacity-80">
                            {CurrencyTranslator.convert(stats.supportValue || 0, lang).symbol}
                        </span>
                    </div>
                    <p className="support-description mt-2 text-rose-100 text-sm font-medium">
                        {t.support.contributionDesc}
                    </p>
                </div>
                {/* Decorative background circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
            </div>

            {/* Watch Ad Card */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="support-ad-card bg-white rounded-2xl p-6 border-2 border-orange-100 shadow-sm relative overflow-hidden"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="support-ad-icon-wrapper w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-orange-600 fill-orange-600" />
                    </div>
                    <div className="support-ad-text-container">
                        <h3 className="support-ad-title font-black text-gray-800">{t.support.watchAdTitle}</h3>
                        <p className="support-ad-subtitle text-xs text-gray-400 font-bold uppercase tracking-wider">{t.support.watchAdSubtitle}</p>
                    </div>
                </div>
                <p className="support-ad-disclaimer text-sm text-gray-600 mb-6 leading-relaxed">
                    {t.support.adDisclaimer}
                </p>

                {adError && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="support-ad-error text-xs text-rose-500 font-bold mb-4 text-center p-3 bg-rose-50 rounded-xl border border-rose-100"
                    >
                        {t.support.adsNotReady}
                    </motion.p>
                )}

                <button
                    onClick={handleWatchAd}
                    disabled={isWatching}
                    className="support-watch-button w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-black flex items-center justify-center gap-2 shadow-md shadow-orange-200 transition-all"
                >
                    {isWatching ? (
                        <div className="support-loading-spinner w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            <span className="support-button-text">
                                {CurrencyTranslator.translateSupportString(t.support.addSupportButton, 0.02, lang)}
                            </span>
                        </>
                    )}
                </button>

                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="support-success-overlay absolute inset-0 bg-orange-500 flex flex-col items-center justify-center p-4 text-white z-20"
                        >
                            <div className="support-success-message flex items-center gap-2 font-black text-xl mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                                {t.support.thankYou}
                            </div>
                            <div className="support-success-gif-container w-full max-w-[150px] aspect-square rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                                <iframe
                                    src="https://tenor.com/embed/23625303"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                    title="Success Cat"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Direct Support Links */}
            <div className="support-links-container grid grid-cols-1 gap-4">
                <a
                    href="https://buymeacoffee.com/bioly"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="support-link-buycoffee flex items-center gap-4 p-5 bg-[#FFDD00] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm"
                >
                    <div className="support-link-icon-wrapper w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                        <Coffee className="w-6 h-6 text-[#FFDD00] fill-[#FFDD00]" />
                    </div>
                    <div className="support-link-text-container flex-1">
                        <h4 className="support-link-title font-black text-black text-sm uppercase">{t.support.buyCoffeeTitle}</h4>
                        <p className="support-link-description text-[10px] text-black/60 font-bold">{t.support.buyCoffeeDesc}</p>
                    </div>
                    <ExternalLink className="support-link-external-icon w-5 h-5 text-black" />
                </a>

                <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="support-link-patronite flex items-center gap-4 p-5 bg-[#F5DED2] rounded-2xl opacity-60 cursor-not-allowed border border-dashed border-[#E34E26]/30"
                >
                    <div className="support-link-icon-wrapper w-12 h-12 bg-[#E34E26] rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="support-link-text-container flex-1 text-left">
                        <h4 className="support-link-title font-black text-[#E34E26] text-sm uppercase">{t.support.patroniteTitle}</h4>
                        <p className="support-link-description text-[10px] text-[#E34E26]/60 font-bold">{t.support.patroniteUpcoming}</p>
                    </div>
                </a>
            </div>

            <p className="support-footer-note text-center text-[10px] text-gray-400 font-bold px-4 leading-relaxed uppercase tracking-tighter">
                {t.support.footerNote}
            </p>
        </div>
    );
};

export default SupportSection;
