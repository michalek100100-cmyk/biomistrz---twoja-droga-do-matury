import React from 'react';
import { motion } from 'framer-motion';
import { Bell, X, Play } from 'lucide-react';
import { Topic } from '../types';

interface DailyReminderPopupProps {
    topics: (Topic & { unitTitle: string })[];
    onStartQuiz: (topic: Topic) => void;
    onDismiss: () => void;
}

const DailyReminderPopup: React.FC<DailyReminderPopupProps> = ({ topics, onStartQuiz, onDismiss }) => {
    if (topics.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white  rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-orange-200 "
            >
                {/* Close Button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100  rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 bg-orange-100  rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-center mb-2">Czas na powtórkę! 🔥</h2>

                {/* Message */}
                <p className="text-center text-gray-600  mb-6">
                    Powtórz dzisiaj {topics.length === 1 ? 'ten temat' : 'te tematy'}, a zapamiętasz {topics.length === 1 ? 'go' : 'je'} <span className="font-black text-orange-500">500% lepiej!</span>
                </p>

                {/* Topics List */}
                <div className="space-y-3 mb-6">
                    {topics.map(topic => (
                        <div
                            key={topic.id}
                            className="flex items-center justify-between p-4 bg-orange-50  rounded-xl border-2 border-orange-200 "
                        >
                            <div className="flex-1">
                                <p className="font-bold text-sm">{topic.title}</p>
                                <p className="text-xs text-gray-500">{topic.unitTitle}</p>
                            </div>
                            <button
                                onClick={() => {
                                    onStartQuiz(topic);
                                    onDismiss();
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
                            >
                                <Play className="w-4 h-4" />
                                Powtórz
                            </button>
                        </div>
                    ))}
                </div>

                {/* Dismiss Button */}
                <button
                    onClick={onDismiss}
                    className="w-full py-3 bg-gray-100  text-gray-700  rounded-xl font-bold hover:bg-gray-200  transition-colors"
                >
                    Przypom nij później
                </button>
            </motion.div>
        </div>
    );
};

export default DailyReminderPopup;
