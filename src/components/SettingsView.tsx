// src/components/SettingsView.tsx
import React from 'react';
import {
    Settings,
    Volume2,
    LogOut,
    Trash2,
    Bell,
    Moon,
    Languages,
    ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toggle from './ui/Toggle';
import { useLanguage } from '../contexts/LanguageContext';
import { UserStats } from '../types';

interface SettingsViewProps {
    settings: {
        darkMode: boolean;
        sound: boolean;
        notifications: boolean;
    };
    onToggle: (key: keyof SettingsViewProps['settings']) => void;
    onLogout: () => void;
    onResetAll?: () => void;
    stats: UserStats;
    onUpdateStats: (newStats: UserStats) => void;
}

const COUNTRIES = [
    { code: 'PL', flag: '🇵🇱', name: 'Polska' },
    { code: 'US', flag: '🇺🇸', name: 'USA' },
    { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
    { code: 'DE', flag: '🇩🇪', name: 'Deutschland' },
    { code: 'ES', flag: '🇪🇸', name: 'España' },
    { code: 'CZ', flag: '🇨🇿', name: 'Česko' },
    { code: 'CN', flag: '🇨🇳', name: 'China' },
    { code: 'JP', flag: '🇯🇵', name: 'Japan' },
    { code: 'FR', flag: '🇫🇷', name: 'France' },
    { code: 'IT', flag: '🇮🇹', name: 'Italia' },
    { code: 'BR', flag: '🇧🇷', name: 'Brasil' },
    { code: 'UA', flag: '🇺🇦', name: 'Ukraine' },
    { code: 'OTHER', flag: '🌍', name: 'Other / Inny' },
];

const SettingsView: React.FC<SettingsViewProps> = ({
    settings,
    onToggle,
    onLogout,
    onResetAll,
    stats,
    onUpdateStats
}) => {
    const { language, setLanguage, t } = useLanguage();
    const [isLangOpen, setIsLangOpen] = React.useState(false);
    const [isCountryOpen, setIsCountryOpen] = React.useState(false);

    const languages = [
        { code: 'pl', label: 'Polski', flag: '🇵🇱' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'ch', label: '中文', flag: '🇨🇳' },
        { code: 'cz', label: 'Čeština', flag: '🇨🇿' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'jp', label: '日本語', flag: '🇯🇵' },
    ] as const;

    const currentLang = languages.find(l => l.code === language) || languages[0];
    const currentCountry = COUNTRIES.find(c => c.code === (stats.country || 'PL')) || COUNTRIES[0];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-100  rounded-2xl">
                    <Settings className="w-6 h-6 text-purple-600 " />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800 ">{t.settings.title}</h2>
                    <p className="text-gray-500 text-sm font-bold">{t.settings.subtitle}</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Tryb Ciemny */}
                <Toggle
                    label={t.settings.darkMode}
                    description={t.settings.darkModeDesc}
                    active={settings.darkMode}
                    onToggle={() => onToggle('darkMode')}
                    icon={Moon}
                />
                {/* Dźwięk */}
                <Toggle
                    label={t.settings.sound}
                    description={t.settings.soundDesc}
                    active={settings.sound}
                    onToggle={() => onToggle('sound')}
                    icon={Volume2}
                />

                {/* Powiadomienia */}
                <Toggle
                    label={t.settings.notifications}
                    description={t.settings.notificationsDesc}
                    active={settings.notifications}
                    onToggle={() => onToggle('notifications')}
                    icon={Bell}
                />

                {/* Language Switch */}
                <div className="rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden transition-all">
                    <button
                        onClick={() => {
                            setIsLangOpen(!isLangOpen);
                            setIsCountryOpen(false);
                        }}
                        className="w-full p-4 flex items-center gap-4 hover:bg-gray-100/50 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Languages className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="text-sm font-black text-gray-800 leading-none mb-1">{t.settings.language}</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                {currentLang.flag} {currentLang.label}
                            </p>
                        </div>
                        <motion.div
                            animate={{ rotate: isLangOpen ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                        >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {isLangOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="border-t border-gray-100 bg-white"
                            >
                                <div className="p-2 grid grid-cols-1 gap-1">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code);
                                                setIsLangOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${language === lang.code
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'hover:bg-gray-50 text-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{lang.flag}</span>
                                                <span className="text-sm font-black uppercase tracking-wide">{lang.label}</span>
                                            </div>
                                            {language === lang.code && (
                                                <motion.div
                                                    layoutId="active-check-lang"
                                                    className="w-2 h-2 rounded-full bg-blue-600"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Country Switch */}
                <div className="rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden transition-all">
                    <button
                        onClick={() => {
                            setIsCountryOpen(!isCountryOpen);
                            setIsLangOpen(false);
                        }}
                        className="w-full p-4 flex items-center gap-4 hover:bg-gray-100/50 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <span className="text-xl leading-none">🚩</span>
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="text-sm font-black text-gray-800 leading-none mb-1">Kraj / Country</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                {currentCountry.flag} {currentCountry.name}
                            </p>
                        </div>
                        <motion.div
                            animate={{ rotate: isCountryOpen ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                        >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {isCountryOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="border-t border-gray-100 bg-white"
                            >
                                <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1 overflow-y-auto max-h-60 custom-scrollbar">
                                    {COUNTRIES.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => {
                                                onUpdateStats({ ...stats, country: country.code });
                                                setIsCountryOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${(stats.country || 'PL') === country.code
                                                ? 'bg-orange-50 text-orange-600'
                                                : 'hover:bg-gray-50 text-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{country.flag}</span>
                                                <span className="text-sm font-black uppercase tracking-wide">{country.name}</span>
                                            </div>
                                            {(stats.country || 'PL') === country.code && (
                                                <motion.div
                                                    layoutId="active-check-country"
                                                    className="w-2 h-2 rounded-full bg-orange-600"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="pt-6 space-y-3">
                {onResetAll && (
                    <button
                        onClick={() => {
                            if (window.confirm(t.settings.resetConfirm)) {
                                onResetAll();
                            }
                        }}
                        className="w-full p-4 rounded-2xl bg-red-50  text-red-600  font-bold flex items-center justify-center gap-2 hover:bg-red-100  transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                        {t.settings.resetProgress}
                    </button>
                )}

                <button
                    onClick={onLogout}
                    className="w-full p-4 rounded-2xl bg-gray-100  text-gray-600  font-bold flex items-center justify-center gap-2 hover:bg-gray-200  transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    {t.settings.logout}
                </button>
            </div>

            <div className="text-center pt-8">
                <p className="text-xs text-gray-400 font-mono">{t.settings.version}</p>
                <p className="text-[10px] text-gray-300 mt-1">{t.settings.footer}</p>
            </div>
        </div>
    );
};

export default SettingsView;
