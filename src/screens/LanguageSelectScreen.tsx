import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';

interface LanguageOption {
    code: Language;
    label: string;
    flag: string;
    nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'pl', label: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
    { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
    { code: 'de', label: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
    { code: 'cz', label: 'Czech', flag: '🇨🇿', nativeName: 'Čeština' },
    { code: 'ch', label: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
    { code: 'jp', label: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
];

interface CountryOption {
    code: string;
    flag: string;
    name: string;
}

const COUNTRIES: CountryOption[] = [
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

interface Props {
    onSelect: () => void;
}

const LanguageSelectScreen: React.FC<Props> = ({ onSelect }) => {
    const { language, setLanguage } = useLanguage();
    const [step, setStep] = React.useState<'language' | 'country'>('language');
    const [selectedCountry, setSelectedCountry] = React.useState<string | null>(() => {
        return localStorage.getItem('app_country') || null;
    });

    const handleLanguageConfirm = () => {
        setStep('country');
    };

    const handleCountryConfirm = () => {
        if (selectedCountry) {
            localStorage.setItem('app_country', selectedCountry);
            localStorage.setItem('hasSelectedLanguage', 'true');
            onSelect();
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a] z-[200] overflow-hidden">
            {/* Background decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm"
            >
                {/* Logo / icon */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="mb-6 flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-2xl shadow-blue-900/50"
                >
                    <span className="text-4xl">{step === 'language' ? '🌍' : '🚩'}</span>
                </motion.div>

                {/* Title */}
                <h1 className="text-3xl font-black text-white mb-1 tracking-tight text-center">
                    {step === 'language' ? 'Choose language' : 'Choose your country'}
                </h1>
                <p className="text-blue-200/70 text-sm mb-8 text-center">
                    {step === 'language'
                        ? 'Wybierz język / Select language'
                        : 'Twoja flaga w rankingu / Your flag in ranking'}
                </p>

                {/* Content */}
                <div className="grid grid-cols-2 gap-3 w-full max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {step === 'language' ? (
                        LANGUAGES.map((lang, index) => {
                            const isSelected = language === lang.code;
                            return (
                                <motion.button
                                    key={lang.code}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 180 }}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setLanguage(lang.code)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${isSelected
                                        ? 'bg-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/20'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-3xl leading-none">{lang.flag}</span>
                                    <div className="flex flex-col items-start">
                                        <span className="text-white font-bold text-sm leading-tight">{lang.nativeName}</span>
                                        <span className="text-white/40 text-xs">{lang.label}</span>
                                    </div>
                                </motion.button>
                            );
                        })
                    ) : (
                        COUNTRIES.map((country, index) => {
                            const isSelected = selectedCountry === country.code;
                            return (
                                <motion.button
                                    key={country.code}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, type: 'spring', stiffness: 180 }}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setSelectedCountry(country.code)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${isSelected
                                        ? 'bg-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/20'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-3xl leading-none">{country.flag}</span>
                                    <span className="text-white font-bold text-sm leading-tight">{country.name}</span>
                                </motion.button>
                            );
                        })
                    )}
                </div>

                {/* Action Button */}
                <div className="flex gap-3 w-full mt-6">
                    {step === 'country' && (
                        <button
                            onClick={() => setStep('language')}
                            className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-all"
                        >
                            Back
                        </button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={step === 'language' ? handleLanguageConfirm : handleCountryConfirm}
                        disabled={step === 'country' && !selectedCountry}
                        className={`py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-base shadow-xl transition-all ${step === 'country' && !selectedCountry ? 'opacity-50 grayscale' : 'shadow-blue-900/40 hover:from-blue-400 hover:to-blue-500'
                            } ${step === 'language' ? 'w-full' : 'flex-[2]'}`}
                    >
                        {step === 'language' ? 'Continue →' : 'Finish →'}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default LanguageSelectScreen;
