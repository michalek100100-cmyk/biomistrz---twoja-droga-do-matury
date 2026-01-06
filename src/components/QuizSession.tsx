import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../types';

interface QuizSessionProps {
  questions: Question[];
  initialIndex?: number;
  initialScore?: number;
  initialWrongIndices?: number[]; 
  onFinish: (score: number) => void;
  onQuit: (score: number, currentIndex: number) => void;
  onXpChange: (amount: number) => void;
  onProgress?: (currentIndex: number, currentScore: number, wrongIndices: number[]) => void;
}

const SOUNDS = {
  SELECT: '/sounds/select.mp3',
  CORRECT: '/sounds/correct.mp3',
  INCORRECT: '/sounds/incorrect.mp3',
};

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
            .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
            .replace(/\^([a-zA-Z0-9]+)/g, '<sup>$1</sup>');
          return (
            <span 
              key={index} 
              className="font-serif italic px-0.5"
              dangerouslySetInnerHTML={{ __html: formattedHtml }} 
            />
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

const QuizSession: React.FC<QuizSessionProps> = ({ 
  questions, 
  initialIndex = 0, 
  initialScore = 0, 
  initialWrongIndices = [], 
  onFinish, 
  onQuit, 
  onXpChange,
  onProgress
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [score, setScore] = useState(initialScore);
  
  const [wrongIndices, setWrongIndices] = useState<number[]>(initialWrongIndices);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0); 
  
  // NOWE: Licznik zadań naprawionych w trybie powtórkowym
  const [solvedReviewCount, setSolvedReviewCount] = useState(0);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const activeQuestionIndex = isReviewMode ? wrongIndices[reviewIndex] : currentIndex;
  const currentQuestion = questions[activeQuestionIndex];

  if (!currentQuestion) {
    onFinish(score);
    return null;
  }

  const shuffledOptions = useMemo(() => {
    let options = currentQuestion.options || (currentQuestion.type === 'true_false' ? ['Prawda', 'Fałsz'] : []);
    let optionsToShuffle = [...options];
    if (currentQuestion.type !== 'true_false') {
      optionsToShuffle.sort(() => Math.random() - 0.5);
    }
    return optionsToShuffle;
  }, [currentQuestion]);

  // --- ZMODYFIKOWANA LOGIKA PASKA POSTĘPU ---
  // Obliczamy ile błędów wizualnie zostało (całkowite błędy minus te już naprawione)
  const currentVisualErrors = Math.max(0, wrongIndices.length - solvedReviewCount);
  
  const errorPercent = (currentVisualErrors / questions.length) * 100;
  let netProgressPercent = 0;

  if (isReviewMode) {
    // W trybie review niebieski pasek "wypycha" czerwony w miarę naprawiania błędów
    netProgressPercent = 100 - errorPercent;
  } else {
    // W trybie normalnym
    const correctOrPassedCount = Math.max(0, currentIndex - wrongIndices.length);
    netProgressPercent = (correctOrPassedCount / questions.length) * 100;
  }

  const actualCorrectAnswer = currentQuestion.correctAnswer || (currentQuestion as any).answer;

  const playSound = useCallback((url: string) => {
    const audio = new Audio(url);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (onProgress && !isReviewMode) {
      onProgress(currentIndex, score, wrongIndices);
    }
  }, [currentIndex, score, wrongIndices, isReviewMode, onProgress]);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    playSound(SOUNDS.SELECT);
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    
    const correct = selectedOption === actualCorrectAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    
    if (correct) {
      if (!isReviewMode) {
        setScore(s => s + 1);
        onXpChange(10);
      } else {
        onXpChange(2);
        // ZMIANA: Jeśli poprawiamy błąd w review mode, zwiększamy licznik naprawionych
        setSolvedReviewCount(prev => prev + 1);
      }
      playSound(SOUNDS.CORRECT);
    } else {
      playSound(SOUNDS.INCORRECT);
      onXpChange(-2);
      
      if (!isReviewMode) {
        setWrongIndices(prev => [...prev, currentIndex]);
      }
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);

    if (isReviewMode) {
      if (reviewIndex + 1 < wrongIndices.length) {
        setReviewIndex(prev => prev + 1);
      } else {
        onFinish(score);
      }
    } else {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        if (wrongIndices.length > 0) {
          setIsReviewMode(true);
          setReviewIndex(0);
          setSolvedReviewCount(0); // Resetujemy licznik przy wejściu w tryb poprawkowy
        } else {
          onFinish(score);
        }
      }
    }
  };

  const handleQuitRequest = () => {
    const indexToSave = isReviewMode ? questions.length : currentIndex;
    onQuit(score, indexToSave);
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[60] flex flex-col transition-colors duration-300">
      
      {/* Header */}
      <div className="px-6 pb-6 pt-14 md:p-10 flex items-center gap-6 max-w-4xl mx-auto w-full">
        <button onClick={handleQuitRequest} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <X className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </button>
        
        {/* Pasek postępu */}
        <div className="flex-1 h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: `${((initialIndex) / questions.length) * 100}%` }}
            animate={{ width: `${netProgressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute left-0 top-0 h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] z-10" 
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${errorPercent}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute right-0 top-0 h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] z-10" 
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                isReviewMode 
                  ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' 
                  : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
              }`}>
                {isReviewMode ? (
                  <span className="flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> Poprawa błędów</span>
                ) : (
                  currentQuestion.topic
                )}
              </span>
              
              <span className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
                {isReviewMode 
                  ? `Błąd ${reviewIndex + 1} z ${wrongIndices.length}`
                  : `Zadanie ${currentIndex + 1} z ${questions.length}`
                }
              </span>
            </div>
            
            <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 leading-tight">
              <FormattedText text={currentQuestion.question} />
            </h2>
          </div>

          <div className="grid gap-4">
            {shuffledOptions.map((option, idx) => {
              const isCorrectOpt = option === actualCorrectAnswer;
              const isSelected = option === selectedOption;
              
              let btnClass = "bg-white border-gray-100 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200";
              
              if (isSelected) {
                btnClass = "bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300";
              }
              
              if (isAnswered) {
                if (isCorrectOpt) {
                  btnClass = "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300";
                } else if (isSelected) {
                  btnClass = "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(option)}
                  className={`p-6 text-left text-lg font-bold rounded-[2rem] border-2 transition-all duo-button-shadow ${btnClass}`}
                >
                  <FormattedText text={option} />
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {isAnswered && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 10 }}
                className="bg-blue-50/50 dark:bg-gray-800/50 p-8 rounded-[2.5rem] border-2 border-blue-50 dark:border-gray-700"
              >
                 <h4 className="font-black text-blue-600 dark:text-blue-400 uppercase text-[10px] mb-3 flex items-center gap-2 tracking-widest">
                   <Sparkles className="w-4 h-4" /> Wyjaśnienie BioMistrza
                 </h4>
                 <p className="text-gray-700 dark:text-gray-300 font-bold leading-relaxed italic text-sm md:text-base">
                   <FormattedText text={currentQuestion.explanation} />
                 </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className={`p-8 md:p-12 border-t-2 transition-colors duration-300 ${
        !isAnswered 
          ? 'bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800' 
          : isCorrect 
            ? 'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-900/50' 
            : 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-900/50'
      }`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            {isAnswered && (
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-3xl ${isCorrect ? 'bg-green-500 shadow-green-200 dark:shadow-none' : 'bg-red-500 shadow-red-200 dark:shadow-none'} shadow-lg`}>
                  {isCorrect ? <CheckCircle2 className="w-10 h-10 text-white" /> : <AlertCircle className="w-10 h-10 text-white" />}
                </div>
                <div>
                  <h3 className={`text-2xl font-black ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {isCorrect ? 'Doskonale!' : 'Poprawna odpowiedź:'}
                  </h3>
                  {!isCorrect && (
                    <p className="font-black text-red-600 dark:text-red-400 text-lg">
                      <FormattedText text={actualCorrectAnswer} />
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={isAnswered ? handleNext : handleCheck}
            disabled={!selectedOption}
            className={`w-full md:w-auto px-16 py-5 rounded-[1.8rem] font-black text-xl uppercase tracking-widest transition-all duo-button-shadow ${
              !selectedOption ? 'bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600' : 
              isAnswered ? (isCorrect ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-red-600 text-white hover:bg-red-500') : 
              'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isAnswered ? 'Kontynuuj' : 'Sprawdź'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSession;