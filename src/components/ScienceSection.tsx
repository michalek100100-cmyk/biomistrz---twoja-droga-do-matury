import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, BookOpen, Lightbulb, CheckCircle2, ArrowRight, ArrowLeft, VideoOff,
  Zap, X, Play, Pause, Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCIENCE_ARTICLES } from '../data/ScienceData';

// --- FORMATOWANIE TEKSTU (LaTeX + BOLD + NEWLINES) ---
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // KROK 1: Podział na linijki (obsługa \n w JSON)
  const lines = text.split('\n');

  return (
    <span>
      {lines.map((line, lineIndex) => (
        // Każda linia to osobny blok (dzięki temu lista 1., 2. będzie w pionie)
        <span key={lineIndex} className="block mb-2 last:mb-0">
          {(() => {
            // KROK 2: Regex, który wyłapuje ALBO LaTeX ($...$) ALBO Bold (**...**)
            // Używamy grupy przechwytującej (), żeby split zachował separatory w tablicy
            const parts = line.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g);

            return parts.map((part, index) => {
              // Przypadek A: LaTeX ($...$)
              if (part.startsWith('$') && part.endsWith('$')) {
                const content = part.slice(1, -1); // Usuwamy $
                const formattedHtml = content
                  .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
                  .replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>')
                  .replace(/\\delta/g, 'δ')
                  .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
                  .replace(/\^([a-zA-Z0-9\+\-]+)/g, '<sup>$1</sup>');
                return (
                  <span
                    key={index}
                    className="font-serif italic px-0.5 text-blue-600 font-bold"
                    dangerouslySetInnerHTML={{ __html: formattedHtml }}
                  />
                );
              }

              // Przypadek B: Pogrubienie (**...**)
              if (part.startsWith('**') && part.endsWith('**')) {
                const content = part.slice(2, -2); // Usuwamy **
                return (
                  <strong key={index} className="font-black text-gray-900 ">
                    {content}
                  </strong>
                );
              }

              // Przypadek C: Zwykły tekst
              return <span key={index}>{part}</span>;
            });
          })()}
        </span>
      ))}
    </span>
  );
};
// --- POMOCNICZE: PRZYGOTOWANIE SŁÓW DO RSVP ---
const prepareWordsForRSVP = (articles: any[]) => {
  if (!articles) return [];

  const fullText = articles.flatMap(article =>
    article.content
      .filter((block: any) => ['text', 'header', 'tip'].includes(block.type))
      .map((block: any) => block.value)
  ).join(" "); // Łączymy bloki spacją

  const cleanText = fullText
    .replace(/\\n/g, " ")     // Zamień znaki nowej linii na spacje (dla płynności RSVP)
    .replace(/\n/g, " ")      // Zamień prawdziwe newliny na spacje
    .replace(/\$/g, "")       // Usuń dolary (LaTeX)
    .replace(/\\delta/g, "delta")
    .replace(/[_^{}]/g, "")   // Usuń znaki formatowania LaTeX
    .replace(/\*\*/g, "")     // Usuń gwiazdki (zostaw tekst w środku)
    .replace(/\s+/g, " ");    // Usuń podwójne spacje powstałe po czyszczeniu

  return cleanText.trim().split(" ");
};
// --- POMOCNICZE: OBLICZANIE PUNKTU SKUPIENIA (ORP) ---
const getRSVPWordParts = (word: string) => {
  if (!word) return { left: '', center: '', right: '' };
  const centerIndex = Math.floor((word.length - 1) / 2);
  return {
    left: word.slice(0, centerIndex),
    center: word[centerIndex],
    right: word.slice(centerIndex + 1)
  };
};

interface ScienceSectionProps {
  topicId: string;
  topicTitle: string;
  onBack: () => void;
}

const ScienceSection: React.FC<ScienceSectionProps> = ({ topicId, topicTitle, onBack }) => {
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

  // --- STANY ULTRA UCZENIA ---
  const [isUltraMode, setIsUltraMode] = useState(false);
  const [rsvpPlaying, setRsvpPlaying] = useState(false);
  const [rsvpIndex, setRsvpIndex] = useState(0);
  const [wpm, setWpm] = useState(350);

  const articles = SCIENCE_ARTICLES[topicId];
  const currentArticle = articles ? articles[currentArticleIndex] : null;

  const rsvpWords = useMemo(() => isUltraMode ? prepareWordsForRSVP(articles) : [], [articles, isUltraMode]);

  useEffect(() => {
    setQuizAnswered(null);
  }, [currentArticleIndex]);

  // --- SILNIK RSVP ---
  useEffect(() => {
    let interval: any;
    if (rsvpPlaying && isUltraMode && rsvpIndex < rsvpWords.length) {
      const delay = 60000 / wpm;
      const currentWord = rsvpWords[rsvpIndex];
      let finalDelay = delay;
      if (currentWord.includes('.') || currentWord.includes(',')) finalDelay = delay * 1.5;

      interval = setTimeout(() => {
        setRsvpIndex(prev => prev + 1);
      }, finalDelay);
    } else if (rsvpIndex >= rsvpWords.length) {
      setRsvpPlaying(false);
    }
    return () => clearTimeout(interval);
  }, [rsvpPlaying, isUltraMode, rsvpIndex, wpm, rsvpWords]);

  if (!articles || articles.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-white  flex flex-col items-center justify-center p-8">
        {/* ZMIANA 1: Bezpieczny odstęp dla przycisku powrotu w ekranie błędu */}
        <button
          onClick={onBack}
          className="absolute left-6 p-2 bg-gray-100  rounded-full hover:bg-gray-200 transition-colors"
          style={{ top: 'calc(env(safe-area-inset-top) + 1.5rem)' }} // Fallback do klasy, ale inline style dla pewności calc
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 " />
        </button>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-black text-gray-800 ">Jeszcze nie zdążyłem stworzyć tego tematu! za niedługo będzie ☺️</h2>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentArticleIndex < articles.length - 1) {
      setCurrentArticleIndex(prev => prev + 1);
      document.getElementById('science-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBack();
    }
  };

  const handlePrev = () => {
    if (currentArticleIndex > 0) {
      setCurrentArticleIndex(prev => prev - 1);
      document.getElementById('science-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const progressPercent = ((currentArticleIndex + 1) / articles.length) * 100;

  // --- RENDEROWANIE ULTRA MODE ---
  if (isUltraMode) {
    const wordParts = getRSVPWordParts(rsvpWords[rsvpIndex] || "");
    const isHighSpeed = wpm >= 1000;

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white">

        {/* ZMIANA 2: Bezpieczny odstęp dla przycisku zamknięcia Ultra Mode */}
        <button
          onClick={() => { setIsUltraMode(false); setRsvpPlaying(false); setRsvpIndex(0); }}
          className="absolute right-6 p-2 hover:bg-gray-800 rounded-full transition-colors"
          style={{ top: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
        >
          <X className="w-8 h-8 text-gray-400" />
        </button>

        {!rsvpPlaying && rsvpIndex === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 max-w-md px-4"
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-pulse">
              <Zap className="w-12 h-12 text-black fill-current" />
            </div>
            <h2 className="text-4xl font-black tracking-tight">Ultra Uczenie</h2>
            <p className="text-gray-400 text-lg">
              Wszystkie artykuły z tego tematu zostaną wyświetlone w technologii RSVP.
              Skup wzrok na <span className="text-red-500 font-bold">czerwonej literze</span>.
            </p>
            <button
              onClick={() => setRsvpPlaying(true)}
              className="px-10 py-4 bg-white text-black text-xl font-black rounded-2xl hover:scale-105 transition-transform shadow-xl"
            >
              ZACZNIJ
            </button>
            <div className="text-sm text-gray-500 font-mono">
              Słów do przeczytania: {rsvpWords.length} • Szacowany czas: {Math.ceil(rsvpWords.length / wpm)} min
            </div>
          </motion.div>
        ) : (
          <div className="w-full max-w-4xl flex flex-col items-center gap-12 px-4">

            {/* Pasek postępu czytania */}
            <div className="w-full max-w-md h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${(rsvpIndex / rsvpWords.length) * 100}%` }}
              />
            </div>

            {/* SŁOWO RSVP */}
            <div className="relative w-full h-40 flex items-center justify-center font-mono text-5xl md:text-7xl font-bold select-none">
              <div className="absolute top-0 bottom-0 w-[2px] bg-gray-800 left-1/2 -translate-x-1/2 z-0 opacity-30" />
              <div className="absolute left-4 right-4 h-[1px] bg-gray-800 top-1/2 -translate-y-1/2 z-0 opacity-30" />

              <div className="flex items-baseline w-full z-10">
                <span className="flex-1 text-right text-gray-300">
                  {wordParts.left}
                </span>
                <span className="text-red-500 mx-0.5 transform scale-110 inline-block">
                  {wordParts.center}
                </span>
                <span className="flex-1 text-left text-gray-300">
                  {wordParts.right}
                </span>
              </div>
            </div>

            {/* KONTROLKI (SLIDER) */}
            <div className="w-full max-w-sm flex flex-col items-center gap-6">

              {/* Play/Pause */}
              <button
                onClick={() => setRsvpPlaying(!rsvpPlaying)}
                className="p-6 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
              >
                {rsvpPlaying ? <Pause className="w-10 h-10 text-white" /> : <Play className="w-10 h-10 ml-1 text-white" />}
              </button>

              {/* Slider Container */}
              <div className="w-full space-y-4 pt-4">
                <div className="relative w-full h-6 flex items-center">
                  {/* Slider Input */}
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={wpm}
                    onChange={(e) => setWpm(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer z-10 focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #374151 0%, #374151 0%)`,
                      backgroundColor: 'transparent'
                    }}
                  />

                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-lg overflow-hidden pointer-events-none">
                    <div
                      className="w-full h-full"
                      style={{
                        background: 'linear-gradient(90deg, #22c55e 0%, #22c55e 64%, #eab308 64%, #eab308 100%)'
                      }}
                    />
                  </div>
                </div>

                <div className={`flex flex-col items-center transition-colors duration-300 ${isHighSpeed ? 'text-yellow-500' : 'text-gray-400'}`}>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black font-mono">{wpm}</span>
                    <span className="text-sm font-bold mb-1.5">WPM</span>
                  </div>
                  {isHighSpeed && (
                    <span className="text-[10px] uppercase font-black tracking-widest animate-pulse flex items-center gap-1">
                      <Gauge className="w-3 h-3" /> Strefa Prędkości
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!rsvpPlaying && rsvpIndex >= rsvpWords.length && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center space-y-6 z-50">
                <CheckCircle2 className="w-20 h-20 text-green-500" />
                <h3 className="text-3xl font-black">Trening zakończony!</h3>
                <button onClick={() => setIsUltraMode(false)} className="px-8 py-3 bg-white text-black font-bold rounded-xl">
                  Wróć do lekcji
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- RENDEROWANIE STANDARDOWE ---
  return (
    <div className="fixed inset-0 z-[60] bg-white  flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">

      {/* HEADER - ZMODYFIKOWANY POD IPHONE */}
      <div className="
        pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-4 md:p-6 
        border-b border-gray-100  
        flex items-center justify-between 
        bg-white/90  backdrop-blur-md 
        sticky top-0 z-20
      ">
        <button onClick={onBack} className="p-2 bg-gray-100  rounded-full text-gray-600  hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 px-4">
          <div className="flex justify-center mb-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              Część {currentArticleIndex + 1} z {articles.length}
            </span>
          </div>
          <div className="h-1.5 w-full max-w-[150px] mx-auto bg-gray-100  rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-blue-500"
            />
          </div>
        </div>

        {/* PRZYCISK ULTRA UCZENIE */}
        <button
          onClick={() => setIsUltraMode(true)}
          className="p-2 bg-green-100  text-green-600  rounded-full hover:scale-110 transition-transform animate-pulse"
          title="Tryb Ultra Uczenia"
        >
          <Zap className="w-6 h-6 fill-current" />
        </button>
      </div>

      {/* CONTENT SCROLLABLE */}
      <div id="science-scroll-container" className="flex-1 overflow-y-auto p-4 md:p-8 pb-48">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentArticleIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            {/* TYTUŁ */}
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900  leading-tight">
                {currentArticle!.title}
              </h1>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                <BookOpen className="w-4 h-4" /> Temat główny: {topicTitle}
              </div>
            </div>

            <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100  relative group">
              {currentArticle!.videoUrl ? (
                currentArticle!.videoUrl.includes('youtube') ||
                  currentArticle!.videoUrl.includes('youtu.be') ||
                  currentArticle!.videoUrl.includes('drive.google.com') ? (
                  <iframe
                    src={currentArticle!.videoUrl}
                    title="Wideo edukacyjne"
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen"
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
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-100 ">
                  <VideoOff className="w-12 h-12 mb-2 opacity-50" />
                  <span className="font-bold text-sm">Jeszcze nie zdążyłem zrobić video 😭</span>
                </div>
              )}
            </div>

            {/* TREŚĆ */}
            <div className="space-y-6 text-lg leading-relaxed text-gray-700 ">
              {currentArticle!.content.map((block, idx) => {
                if (block.type === 'header') {
                  return <h3 key={idx} className="text-2xl font-black text-gray-800  pt-6 border-l-4 border-blue-500 pl-4">{block.value}</h3>;
                }
                if (block.type === 'tip') {
                  return (
                    <div key={idx} className="bg-blue-50  p-6 rounded-2xl border border-blue-100  flex gap-4 my-6">
                      <Lightbulb className="w-8 h-8 text-blue-500 shrink-0" />
                      <div>
                        <h4 className="font-black text-blue-700  text-xs uppercase tracking-widest mb-1">Wskazówka BioMistrza</h4>
                        <p className="text-blue-900  font-medium text-base"><FormattedText text={block.value} /></p>
                      </div>
                    </div>
                  );
                }
                return <p key={idx}><FormattedText text={block.value} /></p>;
              })}
            </div>

            {/* MIKRO QUIZ */}
            {currentArticle!.miniQuiz && (
              <div className="mt-12 pt-8 border-t-2 border-gray-100 ">
                <h3 className="text-xl font-black text-gray-800  mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" /> Sprawdź, czy rozumiesz
                </h3>
                <div className="bg-gray-50  p-6 rounded-3xl space-y-4 shadow-sm border border-gray-100 ">
                  <p className="font-bold text-lg text-gray-800 "><FormattedText text={currentArticle!.miniQuiz!.question} /></p>
                  <div className="grid gap-2">
                    {currentArticle!.miniQuiz!.options.map((opt, i) => {
                      const isSelected = quizAnswered === i;
                      const isCorrect = i === currentArticle!.miniQuiz!.correctIndex;
                      let btnClass = "bg-white  border-2 border-gray-200  text-gray-600  hover:border-blue-400";
                      if (quizAnswered !== null) {
                        if (isCorrect) btnClass = "bg-green-100 border-green-500 text-green-800   shadow-sm";
                        else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-800  ";
                        else btnClass = "bg-gray-100 text-gray-400 border-transparent opacity-50 cursor-not-allowed";
                      }
                      return (
                        <button key={i} disabled={quizAnswered !== null} onClick={() => setQuizAnswered(i)} className={`w-full p-4 rounded-xl font-bold text-left transition-all ${btnClass}`}>
                          <div className="flex justify-between items-center"><FormattedText text={opt} />{quizAnswered !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}</div>
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {quizAnswered === currentArticle!.miniQuiz!.correctIndex && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-green-100  text-green-800  rounded-xl text-center font-bold text-sm">
                        <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Świetnie!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div className="p-4 bg-white  border-t border-gray-100  absolute bottom-0 w-full z-20 flex gap-4">
        {currentArticleIndex > 0 && (
          <button onClick={handlePrev} className="px-6 py-4 bg-gray-100  text-gray-600  rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200  transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <button onClick={handleNext} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${currentArticleIndex === articles.length - 1 ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-200/50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-200/50'}`}>
          {currentArticleIndex === articles.length - 1 ? 'Zakończ naukę' : 'Następna część'} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ScienceSection;
