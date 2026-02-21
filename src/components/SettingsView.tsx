// src/components/SettingsView.tsx
import React from 'react';
import {
    Settings,
    Volume2,
    LogOut,
    Trash2,
    Bell,
    Moon
} from 'lucide-react';
import Toggle from './ui/Toggle';

interface SettingsViewProps {
    settings: {
        darkMode: boolean;
        sound: boolean;
        notifications: boolean;
    };
    onToggle: (key: keyof SettingsViewProps['settings']) => void;
    onLogout: () => void;
    onResetAll?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    settings,
    onToggle,
    onLogout,
    onResetAll
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-100  rounded-2xl">
                    <Settings className="w-6 h-6 text-purple-600 " />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800 ">Ustawienia</h2>
                    <p className="text-gray-500 text-sm font-bold">Dostosuj aplikację</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Tryb Ciemny */}
                <Toggle
                    label="Tryb Ciemny"
                    description="Zmień wygląd aplikacji"
                    active={settings.darkMode}
                    onToggle={() => onToggle('darkMode')}
                    icon={Moon}
                />
                {/* Dźwięk */}
                <Toggle
                    label="Dźwięki w aplikacji"
                    description="Efekty dźwiękowe w quizach"
                    active={settings.sound}
                    onToggle={() => onToggle('sound')}
                    icon={Volume2}
                />

                {/* Powiadomienia */}
                <Toggle
                    label="Powiadomienia"
                    description="Przypomnienia o nauce i multiplayer"
                    active={settings.notifications}
                    onToggle={() => onToggle('notifications')}
                    icon={Bell}
                />
            </div>

            <div className="pt-6 space-y-3">
                {onResetAll && (
                    <button
                        onClick={() => {
                            if (window.confirm('Czy na pewno chcesz zresetować postępy? Ta operacja jest nieodwracalna.')) {
                                onResetAll();
                            }
                        }}
                        className="w-full p-4 rounded-2xl bg-red-50  text-red-600  font-bold flex items-center justify-center gap-2 hover:bg-red-100  transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                        Resetuj postępy
                    </button>
                )}

                <button
                    onClick={onLogout}
                    className="w-full p-4 rounded-2xl bg-gray-100  text-gray-600  font-bold flex items-center justify-center gap-2 hover:bg-gray-200  transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Wyloguj się
                </button>
            </div>

            <div className="text-center pt-8">
                <p className="text-xs text-gray-400 font-mono">BioMistrz v3.3.0</p>
                <p className="text-[10px] text-gray-300 mt-1">Created with ❤️ for Matura 2026</p>
            </div>
        </div>
    );
};

export default SettingsView;
