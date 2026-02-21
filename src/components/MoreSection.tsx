// src/components/MoreSection.tsx
// Tile-based hub for secondary features on mobile
import React from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    MessageSquare,
    Settings,
    Coffee,
    HelpCircle,
    Sparkles,
    ExternalLink
} from 'lucide-react';

interface MoreSectionProps {
    onNavigate: (tab: string) => void;
}

interface TileItem {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    external?: string;
}

const MoreSection: React.FC<MoreSectionProps> = ({ onNavigate }) => {

    const tiles: TileItem[] = [
        {
            id: 'exams',
            label: 'Arkusze Maturalne',
            description: 'Rozwiąż prawdziwe zadania maturalne',
            icon: FileText,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50 '
        },
        {
            id: 'survey',
            label: 'Ankieta',
            description: 'Pomóż nam ulepszyć aplikację',
            icon: MessageSquare,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50 '
        },
        {
            id: 'settings',
            label: 'Ustawienia',
            description: 'Dostosuj aplikację do siebie',
            icon: Settings,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50 '
        },
        {
            id: 'coffee',
            label: 'Wesprzyj Projekt',
            description: 'Kup mi kawę ☕️',
            icon: Coffee,
            color: 'text-rose-600',
            bgColor: 'bg-rose-50 ',
            external: 'https://buycoffee.to/biomistrz?tab=subs'
        },
    ];

    const handleClick = (tile: TileItem) => {
        if (tile.external) {
            window.open(tile.external, '_blank');
        } else {
            onNavigate(tile.id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-purple-500">
                    <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 ">Więcej</h2>
                <p className="text-gray-400 text-sm">Dodatkowe funkcje i opcje</p>
            </div>

            {/* Tiles Grid */}
            <div className="grid grid-cols-2 gap-4">
                {tiles.map((tile, index) => {
                    const Icon = tile.icon;

                    return (
                        <motion.button
                            key={tile.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleClick(tile)}
                            className={`relative flex flex-col items-start p-5 rounded-2xl ${tile.bgColor} border border-white/50  text-left hover:scale-[1.02] active:scale-[0.98] transition-transform overflow-hidden`}
                        >
                            {/* External link indicator */}
                            {tile.external && (
                                <ExternalLink className="absolute top-3 right-3 w-4 h-4 text-gray-400" />
                            )}

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl ${tile.bgColor} flex items-center justify-center mb-3`}>
                                <Icon className={`w-6 h-6 ${tile.color}`} />
                            </div>

                            {/* Text */}
                            <h3 className={`font-bold text-sm ${tile.color} mb-1`}>{tile.label}</h3>
                            <p className="text-xs text-gray-500  line-clamp-2">{tile.description}</p>
                        </motion.button>
                    );
                })}
            </div>

            {/* Help Section */}
            <div className="bg-blue-50  rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100  rounded-xl flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5 text-blue-600 " />
                </div>
                <div>
                    <h4 className="font-bold text-blue-800  text-sm mb-1">Potrzebujesz pomocy?</h4>
                    <p className="text-xs text-blue-600 ">
                        Użyj przycisku 🐛 w prawym dolnym rogu, żeby zgłosić błąd lub sugestię.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default MoreSection;
