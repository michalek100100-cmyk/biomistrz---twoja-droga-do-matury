// src/components/TopicActionMenu.tsx
// Modal for selecting topic action (Learn or Quiz)
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, BrainCircuit } from 'lucide-react';
import { Topic } from '../types';

interface TopicActionMenuProps {
    topic: Topic;
    onClose: () => void;
    onStartQuiz: () => void;
    onStartLearn: () => void;
}

const TopicActionMenu: React.FC<TopicActionMenuProps> = ({
    topic,
    onClose,
    onStartQuiz,
    onStartLearn
}) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white  rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-gray-100 "
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600" />
                <h2 className="text-2xl font-black text-gray-800  mb-2 text-center">{topic.title}</h2>
                <p className="text-gray-500  text-center text-sm font-bold mb-8">Wybierz tryb pracy</p>

                <div className="grid gap-4">
                    <button onClick={onStartLearn} className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50  hover:bg-blue-100  border-2 border-blue-100  transition-all group text-left">
                        <div className="p-3 bg-white  rounded-xl shadow-sm text-blue-600  group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-blue-900 ">Nauka (Teoria)</h3>
                            <p className="text-xs text-blue-600  font-bold opacity-70">Artykuły, wideo i przykłady</p>
                        </div>
                    </button>

                    <button onClick={onStartQuiz} className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50  hover:bg-purple-100  border-2 border-purple-100  transition-all group text-left">
                        <div className="p-3 bg-white  rounded-xl shadow-sm text-purple-600  group-hover:scale-110 transition-transform">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-purple-900 ">Ćwiczenia (Quiz)</h3>
                            <p className="text-xs text-purple-600  font-bold opacity-70">Sprawdź wiedzę w praktyce</p>
                        </div>
                    </button>
                </div>

                <button onClick={onClose} className="mt-8 w-full py-3 rounded-xl font-black text-gray-400  hover:bg-gray-100  transition-colors text-sm uppercase tracking-wider">
                    Anuluj
                </button>
            </motion.div>
        </motion.div>
    );
};

export default TopicActionMenu;
