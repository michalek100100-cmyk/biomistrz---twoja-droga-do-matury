import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Bot } from 'lucide-react';
import { UserStats } from '../types';

interface MatchmakingScreenProps {
   stats: UserStats;
   opponent?: any; // Using any to handle both UserStats and Lobby Player objects
   onCancel: () => void;
   onAddBot: () => void;
}

const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ stats, opponent, onCancel, onAddBot }) => {
   const [dots, setDots] = useState('.');
   const [showBotOption, setShowBotOption] = useState(false);

   // Animacja kropek "Szukanie..."
   useEffect(() => {
      const interval = setInterval(() => {
         setDots(prev => prev.length >= 3 ? '.' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
   }, []);

   // Show bot option after 5 seconds
   useEffect(() => {
      if (opponent) return; // Don't show if opponent found

      const timer = setTimeout(() => {
         setShowBotOption(true);
      }, 5000);

      return () => clearTimeout(timer);
   }, [opponent]);

   return (
      <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white overflow-hidden">

         {/* TŁO ANIMOWANE */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full border-dashed"
            />
            <motion.div
               animate={{ rotate: -360 }}
               transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full"
            />
         </div>

         <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center space-y-16">

            {/* NAGŁÓWEK */}
            <div className="text-center space-y-2 h-24">
               {!opponent ? (
                  <motion.div
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="flex flex-col items-center"
                  >
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-purple-300 mb-4 animate-pulse">
                        <Search className="w-3 h-3" /> Szukanie rywala
                     </div>
                     <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter">
                        ARENA 1v1
                     </h2>
                     <p className="text-gray-400 font-medium">
                        {showBotOption ? "Szukanie trwa dłużej niż zwykle..." : `Dobieranie przeciwnika${dots}`}
                     </p>
                  </motion.div>
               ) : (
                  <motion.div
                     initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                     className="flex flex-col items-center"
                  >
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/50 text-xs font-bold uppercase tracking-widest text-green-300 mb-4">
                        Walka znaleziona!
                     </div>
                     <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                        GOTÓW!
                     </h2>
                     <p className="text-gray-300 font-medium">Za chwilę rozpocznie się pojedynek...</p>
                  </motion.div>
               )}
            </div>

            {/* SCENA VS (AVATARY) */}
            <div className="flex items-center justify-center gap-6 w-full">

               {/* TY (GRACZ) */}
               <div className="flex flex-col items-center gap-4 group">

                  {/* Avatar Container with Pulse */}
                  <div className="relative">
                     <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-1 shadow-[0_0_40px_rgba(37,99,235,0.6)] relative z-10">
                        <div className="w-full h-full bg-gray-900 rounded-[1.3rem] overflow-hidden flex items-center justify-center">
                           {stats.avatar ? (
                              <img src={stats.avatar} className="w-full h-full object-cover" />
                           ) : (
                              <span className="text-4xl font-black">{stats.name.charAt(0)}</span>
                           )}
                        </div>
                     </div>

                     {/* Radar Effect - Correctly positioned relative to avatar */}
                     {!opponent && (
                        <motion.div
                           animate={{ scale: [0.8, 2], opacity: [0, 0.5, 0] }}
                           transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                           className="absolute inset-0 bg-blue-500 rounded-3xl -z-10"
                        />
                     )}
                  </div>

                  <div className="bg-gray-800/80 backdrop-blur px-4 py-1.5 rounded-xl border border-white/10 text-center min-w-[100px]">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ty</p>
                     <p className="font-bold text-white truncate max-w-[120px]">{stats.name}</p>
                  </div>
               </div>

               {/* VS BADGE */}
               <div className="relative z-20 shrink-0">
                  <motion.div
                     animate={opponent ? { scale: [1, 1.5, 1], rotate: [12, -12, 12] } : {}}
                     transition={{ duration: 0.5 }}
                     className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center border-4 border-gray-900 shadow-xl rotate-12"
                  >
                     <span className="font-black text-white text-lg italic">VS</span>
                  </motion.div>
               </div>

               {/* PRZECIWNIK */}
               <div className="flex flex-col items-center gap-4 relative opacity-100">
                  <AnimatePresence mode='wait'>
                     {!opponent ? (
                        <motion.div
                           key="searching"
                           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                           className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gray-800 border-2 border-white/10 border-dashed p-1 flex items-center justify-center relative z-10"
                        >
                           <span className="text-4xl font-black text-gray-600 animate-pulse">?</span>
                        </motion.div>
                     ) : (
                        <motion.div
                           key="found"
                           initial={{ scale: 0, rotate: 180 }}
                           animate={{ scale: 1, rotate: 0 }}
                           className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-tr from-red-600 to-orange-500 p-1 shadow-[0_0_40px_rgba(220,38,38,0.6)] relative z-10"
                        >
                           <div className="w-full h-full bg-gray-900 rounded-[1.3rem] overflow-hidden flex items-center justify-center">
                              {opponent.avatar ? (
                                 <img src={opponent.avatar} className="w-full h-full object-cover" />
                              ) : (
                                 <span className="text-4xl font-black">{opponent.nick?.charAt(0) || opponent.displayName?.charAt(0) || "?"}</span>
                              )}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  <div className="bg-gray-800/80 backdrop-blur px-4 py-1.5 rounded-xl border border-white/10 text-center min-w-[100px]">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Przeciwnik</p>
                     <p className="font-bold text-white truncate max-w-[120px]">
                        {opponent ? (opponent.nick || opponent.displayName || "Gracz") : "Szukanie..."}
                     </p>
                  </div>
               </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col items-center gap-3 w-full">

               {/* BOT OPTION (Visible after delay) */}
               <AnimatePresence>
                  {!opponent && showBotOption && (
                     <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        onClick={onAddBot}
                        className="group flex items-center justify-center gap-3 w-full py-4 bg-purple-600 hover:bg-purple-500 border border-purple-400/50 rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all duration-300"
                     >
                        <Bot className="w-5 h-5 text-white" />
                        <span className="font-bold text-white uppercase tracking-wider text-sm">Zagraj z BOTEM</span>
                     </motion.button>
                  )}
               </AnimatePresence>

               {/* CANCEL BUTTON */}
               {!opponent && (
                  <button
                     onClick={onCancel}
                     className="group flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-2xl transition-all duration-300"
                  >
                     <X className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
                     <span className="font-bold text-gray-300 group-hover:text-white uppercase tracking-wider text-sm">Anuluj</span>
                  </button>
               )}

               {/* LOADING SPINNER (When opponent found) */}
               {opponent && (
                  <div className="h-[56px] flex items-center justify-center">
                     <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
               )}
            </div>

         </div>
      </div>
   );
};

export default MatchmakingScreen;