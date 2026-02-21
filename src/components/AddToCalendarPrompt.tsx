import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface AddToCalendarPromptProps {
    topicTitle: string;
    onYes: () => void;
    onNo: () => void;
}

const AddToCalendarPrompt: React.FC<AddToCalendarPromptProps> = ({ topicTitle, onYes, onNo }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white  rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-gray-200 "
            >
                {/* Icon */}
                <div className="w-16 h-16 bg-orange-100  rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-orange-500" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-black text-center mb-2">Dodać do kalendarza?</h2>

                {/* Message */}
                <p className="text-center text-gray-600  mb-6">
                    Automatycznie zaplanujemy powtórki tematu <span className="font-bold text-gray-800 ">"{topicTitle}"</span> zgodnie z krzywą zapominania
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onNo}
                        className="flex-1 py-3 bg-gray-100  text-gray-700  rounded-xl font-bold hover:bg-gray-200  transition-colors"
                    >
                        Nie, dzięki
                    </button>
                    <button
                        onClick={onYes}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        Tak, dodaj!
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AddToCalendarPrompt;
