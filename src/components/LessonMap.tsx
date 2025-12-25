
import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle } from 'lucide-react';
import { Topic } from '../types';

interface LessonMapProps {
  topics: Topic[];
  onStartTopic: (topic: Topic) => void;
  onResetTopic: (topicId: string) => void;
}

const LessonMap: React.FC<LessonMapProps> = ({ topics, onStartTopic }) => {
  return (
    <div className="flex flex-col items-center py-12 space-y-24 max-w-lg mx-auto relative">
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 bg-gray-100 -z-10 rounded-full" />

      {topics.map((topic, index) => {
        const isCompleted = topic.progress === 100;
        const offset = Math.sin(index * 1.5) * 80;

        return (
          <motion.div 
            key={topic.id} 
            initial={{ opacity: 0, scale: 0.5, x: offset }}
            whileInView={{ opacity: 1, scale: 1, x: offset }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative flex flex-col items-center group"
          >
            {/* Tooltip */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white px-4 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none scale-90 group-hover:scale-100">
              {topic.title}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
            </div>

            {/* Node */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onStartTopic(topic)}
              className={`relative w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duo-button-shadow border-b-8 z-10 ${
                isCompleted 
                  ? 'bg-green-500 border-green-700 text-white' 
                  : 'bg-blue-500 border-blue-700 text-white'
              }`}
            >
              <span className="text-5xl filter drop-shadow-md">
                {isCompleted ? <CheckCircle className="w-16 h-16" /> : topic.icon}
              </span>
               
              {topic.srsLevel > 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
              )}
            </motion.button>

            {/* Label below */}
            <div className="mt-8 text-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100 w-48">
               <h3 className="font-black text-gray-800 text-sm leading-tight mb-2">{topic.title}</h3>
               <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${topic.progress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-green-500 rounded-full"
                 />
               </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LessonMap;
