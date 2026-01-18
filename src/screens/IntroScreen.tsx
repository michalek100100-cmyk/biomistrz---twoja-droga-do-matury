import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bug, HeartHandshake, Coffee, ArrowRight, Check } from 'lucide-react';

interface IntroScreenProps {
  onFinish: () => void;
  userName: string; // NOWE: Oczekujemy imienia użytkownika
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish, userName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Zredagowana treść podzielona na slajdy
  const slides = [
    {
      id: 0,
      icon: Sparkles,
      color: "text-blue-500",
      bgGradient: "from-blue-500/20 to-cyan-500/20",
      title: `Cześć, ${userName}! 👋`, // ZMIANA: Personalizacja
      content: "Witam Cię w BioMistrzu! To darmowa apka, która pomoże Ci w nauce biologii. Zero reklam, zero wersji premium – czysta wiedza i nauka poprzez zabawę."
    },
    {
      id: 1,
      icon: Bug,
      color: "text-orange-500",
      bgGradient: "from-orange-500/20 to-red-500/20",
      title: "Eksperymentuj!",
      content: "Baw się wszystkimi funkcjami. Jeśli coś nie działa, kliknij w czerwonego robaczka 🐞 w rogu ekranu. Masz pomysł na nową funkcję? Koniecznie napisz mi o tym w sekcji Ankieta!"
    },
    {
      id: 2,
      icon: HeartHandshake,
      color: "text-purple-500",
      bgGradient: "from-purple-500/20 to-pink-500/20",
      title: "One Man Army",
      content: "Pamiętaj, że apkę robię i opłacam zupełnie sam. Niedługo skończą mi się pieniądze z osiemnastki 😅 i będę musiał usunąć apkę albo dodać reklamy (BLEH 🤮)."
    },
    {
      id: 3,
      icon: Coffee,
      color: "text-amber-500",
      bgGradient: "from-amber-500/20 to-yellow-500/20",
      title: "Wesprzyj mnie",
      content: "Jeśli BioMistrz Ci się podoba, proszę wesprzyj utrzymanie aplikacji na buycoffee.to (przycisk kawy na górze). Każde 5 zł miesięcznie to wielka pomoc w utrzymaniu serwerów. Dzięki, że jesteś! 💙"
    }
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  const CurrentIcon = slides[currentIndex].icon;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      
      {/* Kontener slajdu */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            {/* Ikona z tłem */}
            <div className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${slides[currentIndex].bgGradient} shadow-lg mb-4`}>
              <CurrentIcon className={`w-20 h-20 ${slides[currentIndex].color}`} />
            </div>

            {/* Tekst */}
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
                {slides[currentIndex].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed text-lg">
                {slides[currentIndex].content}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nawigacja na dole */}
      <div className="absolute bottom-10 left-0 right-0 px-6 flex flex-col items-center gap-8">
        
        {/* Kropki postępu */}
        <div className="flex gap-2">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? `w-8 ${slides[currentIndex].color.replace('text-', 'bg-')}` 
                  : 'w-2 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Przycisk Dalej */}
        <button
          onClick={handleNext}
          className="w-full max-w-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          {currentIndex === slides.length - 1 ? (
            <>Zaczynamy! <Check className="w-5 h-5" /></>
          ) : (
            <>Dalej <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default IntroScreen;
