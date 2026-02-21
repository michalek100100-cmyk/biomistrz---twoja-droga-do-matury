import React from 'react';
import { motion } from 'framer-motion';
import { Star, Check } from 'lucide-react';
import { Topic } from '../types';

interface LessonMapProps {
  topics: Topic[];
  onStartTopic: (topic: Topic) => void;
  onResetTopic: (topicId: string) => void;
}

const LessonMap: React.FC<LessonMapProps> = ({ topics, onStartTopic }) => {
  return (
    <div className="flex flex-col items-center py-20 space-y-16 max-w-lg mx-auto relative">

      {/* TŁO OZDOBNE (Bloby w tle) */}
      <div className="fixed top-1/3 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/3 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* LINIA ŁĄCZĄCA (Subtelna) */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent -z-10" />

      {topics.map((topic, index) => {
        const isCompleted = topic.progress === 100;

        // Offset dla efektu węża
        const offset = Math.sin(index * 1.8) * 70;

        return (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, scale: 0.8, x: offset }}
            whileInView={{ opacity: 1, scale: 1, x: offset }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="relative z-10 group"
          >
            {/* PRZYCISK TEMATU (Glassmorphism) */}
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStartTopic(topic)}
              className={`
                relative w-40 h-40 rounded-[2.5rem] flex flex-col items-center justify-center p-4
                backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300
                ${isCompleted
                  ? 'bg-green-500/10 border-green-500/30 text-green-600 shadow-[0_10px_40px_rgba(34,197,94,0.2)]'
                  : 'bg-white/10 text-gray-700 hover:bg-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.1)]'
                }
              `}
            >
              {/* Ikona */}
              <span className="text-5xl mb-3 filter drop-shadow-lg transition-transform group-hover:scale-110 duration-300">
                {isCompleted ? <Check className="w-12 h-12" /> : topic.icon}
              </span>

              {/* Tytuł */}
              <span className="text-xs font-bold text-center leading-tight opacity-90 px-2 line-clamp-2 scientific-font">
                {topic.title}
              </span>

              {/* Gwiazdki SRS (lewitujące nad przyciskiem) */}
              {topic.srsLevel > 0 && (
                <div className="absolute -top-3 -right-3 flex">
                  {[...Array(Math.min(topic.srsLevel, 3))].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }} // <--- NAPRAWIONE TUTAJ
                      className="bg-yellow-400 p-1.5 rounded-full border-2 border-white shadow-sm -ml-2 first:ml-0"
                    >
                      <Star className="w-3 h-3 text-white fill-white" />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pasek postępu (Jako dolna krawędź) */}
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-gray-200/20 rounded-t-full overflow-hidden">
                <div
                  className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${topic.progress}%` }}
                />
              </div>
            </motion.button>

            {/* Linia łącząca węzeł z główną linią */}
            <div
              className={`absolute top-1/2 -z-10 h-px w-[70px] border-t-2 border-dashed border-gray-300
              ${offset > 0 ? 'right-full mr-[-35px]' : 'left-full ml-[-35px]'}`}
              style={{ width: Math.abs(offset) }}
            />

          </motion.div>
        );
      })}
    </div>
  );
};

export default LessonMap;