import React, { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen, Lightbulb, CheckCircle2, ArrowRight, ArrowLeft, VideoOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Importujemy dane
import { SCIENCE_ARTICLES } from '../data/ScienceData'; 

// --- FORMATOWANIE TEKSTU ---
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const parts = text.split('$');
  return (
    <span>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const formattedHtml = part
            .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
            .replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>')
            .replace(/\\delta/g, 'δ')
            .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
            .replace(/\^([a-zA-Z0-9\+\-]+)/g, '<sup>$1</sup>');
          return (
            <span key={index} className="font-serif italic px-0.5 text-blue-600 font-bold" dangerouslySetInnerHTML={{ __html: formattedHtml }} />
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

interface ScienceSectionProps {
  topicId: string;    
  topicTitle: string; 
  onBack: () => void;
}

const ScienceSection: React.FC<ScienceSectionProps> = ({ topicId, topicTitle, onBack }) => {
  // Stan: który artykuł z serii czytamy? (zaczynamy od 0)
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  
  // Pobieramy TABLICĘ artykułów dla tego tematu
  const articles = SCIENCE_ARTICLES[topicId];
  
  // Pobieramy aktualny artykuł
  const currentArticle = articles ? articles[currentArticleIndex] : null;

  // Resetujemy quiz przy zmianie artykułu
  useEffect(() => {
    setQuizAnswered(null);
  }, [currentArticleIndex]);

  // Jeśli brak artykułów
  if (!articles || articles.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-8 animate-in fade-in">
        <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">Temat w przygotowaniu</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Materiały dla tematu <strong>{topicTitle}</strong> (ID: {topicId}) są w trakcie tworzenia.
          </p>
        </div>
      </div>
    );
  }

  // Funkcje nawigacji
  const handleNext = () => {
    if (currentArticleIndex < articles.length - 1) {
      setCurrentArticleIndex(prev => prev + 1);
      // Przewiń na górę przy zmianie
      document.getElementById('science-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBack(); // Koniec nauki
    }
  };

  const handlePrev = () => {
    if (currentArticleIndex > 0) {
      setCurrentArticleIndex(prev => prev - 1);
      document.getElementById('science-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Obliczamy postęp czytania (np. 1/3)
  const isLastArticle = currentArticleIndex === articles.length - 1;
  const progressPercent = ((currentArticleIndex + 1) / articles.length) * 100;

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-20">
        <button onClick={onBack} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex-1 px-4">
           {/* Pasek postępu serii artykułów */}
           <div className="flex justify-center mb-1">
             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
               Część {currentArticleIndex + 1} z {articles.length}
             </span>
           </div>
           <div className="h-1.5 w-full max-w-[150px] mx-auto bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progressPercent}%` }}
               className="h-full bg-blue-500"
             />
           </div>
        </div>

        <div className="w-10" /> 
      </div>

      {/* CONTENT SCROLLABLE */}
      {/* Dodajemy ID 'science-scroll-container' żeby móc przewijać programowo */}
      <div id="science-scroll-container" className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        
        {/* ANIMACJA PRZEJŚCIA MIĘDZY ARTYKUŁAMI */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentArticleIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            {/* TYTUŁ AKTUALNEJ CZĘŚCI */}
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
                {currentArticle!.title}
              </h1>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                <BookOpen className="w-4 h-4" /> Temat główny: {topicTitle}
              </div>
            </div>

            {/* WIDEO PLAYER (Placeholder zawsze widoczny) */}
            <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-gray-800 relative">
              {currentArticle!.videoUrl ? (
                currentArticle!.videoUrl.includes('youtube') || currentArticle!.videoUrl.includes('youtu.be') ? (
                  <iframe 
                    src={currentArticle!.videoUrl} 
                    title="Wideo edukacyjne"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={currentArticle!.videoUrl}
                    className="w-full h-full object-contain"
                    controls 
                    playsInline 
                    preload="metadata"
                  >
                    Twoja przeglądarka nie wspiera tego formatu wideo.
                  </video>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-100 dark:bg-gray-800">
                  <VideoOff className="w-12 h-12 mb-2 opacity-50" />
                  <span className="font-bold text-sm">Brak wideo w tej części</span>
                </div>
              )}
            </div>

            {/* TREŚĆ */}
            <div className="space-y-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {currentArticle!.content.map((block, idx) => {
                if (block.type === 'header') {
                  return (
                    <h3 key={idx} className="text-2xl font-black text-gray-800 dark:text-white pt-6 border-l-4 border-blue-500 pl-4">
                      {block.value}
                    </h3>
                  );
                }
                if (block.type === 'tip') {
                  return (
                    <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-4 my-6">
                      <Lightbulb className="w-8 h-8 text-blue-500 shrink-0" />
                      <div>
                        <h4 className="font-black text-blue-700 dark:text-blue-400 text-xs uppercase tracking-widest mb-1">Wskazówka BioMistrza</h4>
                        <p className="text-blue-900 dark:text-blue-200 font-medium text-base">
                          <FormattedText text={block.value} />
                        </p>
                      </div>
                    </div>
                  );
                }
                return (
                  <p key={idx}>
                    <FormattedText text={block.value} />
                  </p>
                );
              })}
            </div>

            {/* MIKRO QUIZ */}
            {currentArticle!.miniQuiz && (
              <div className="mt-12 pt-8 border-t-2 border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" /> Sprawdź, czy rozumiesz
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl space-y-4 shadow-sm border border-gray-100 dark:border-gray-700">
                  <p className="font-bold text-lg text-gray-800 dark:text-white">
                    <FormattedText text={currentArticle!.miniQuiz!.question} />
                  </p>
                  <div className="grid gap-2">
                    {currentArticle!.miniQuiz!.options.map((opt, i) => {
                      const isSelected = quizAnswered === i;
                      const isCorrect = i === currentArticle!.miniQuiz!.correctIndex;
                      
                      let btnClass = "bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400";
                      
                      if (quizAnswered !== null) {
                        if (isCorrect) btnClass = "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200 shadow-sm";
                        else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-200";
                        else btnClass = "bg-gray-100 text-gray-400 border-transparent opacity-50 cursor-not-allowed";
                      }

                      return (
                        <button
                          key={i}
                          disabled={quizAnswered !== null}
                          onClick={() => setQuizAnswered(i)}
                          className={`w-full p-4 rounded-xl font-bold text-left transition-all ${btnClass}`}
                        >
                          <div className="flex justify-between items-center">
                            <FormattedText text={opt} />
                            {quizAnswered !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <AnimatePresence>
                    {quizAnswered === currentArticle!.miniQuiz!.correctIndex && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        className="p-4 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-xl text-center font-bold text-sm"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Świetnie!
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER - NAWIGACJA */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute bottom-0 w-full z-20 flex gap-4">
        
        {/* Przycisk WSTECZ (ukryty na pierwszym slajdzie) */}
        {currentArticleIndex > 0 && (
          <button 
            onClick={handlePrev} 
            className="px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Przycisk DALEJ / ZAKOŃCZ */}
        <button 
          onClick={handleNext} 
          className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
            isLastArticle 
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-200/50' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-200/50'
          }`}
        >
          {isLastArticle ? 'Zakończ naukę' : 'Następna część'} <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default ScienceSection;
