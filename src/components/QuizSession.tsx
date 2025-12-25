
import React, { useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Question } from '../types';

interface QuizSessionProps {
  questions: Question[];
  initialIndex?: number;
  onFinish: (score: number) => void;
  onQuit: (score: number, currentIndex: number) => void;
  onXpChange: (amount: number) => void;
}

const SOUNDS = {
  SELECT: 'https://www.soundjay.com/buttons/sounds/button-16.mp3',
  CORRECT: 'https://www.soundjay.com/buttons/sounds/button-3.mp3',
  INCORRECT: 'https://www.soundjay.com/buttons/sounds/button-10.mp3',
};

const QuizSession: React.FC<QuizSessionProps> = ({ questions, initialIndex = 0, onFinish, onQuit, onXpChange }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  
  // FIX: Pobieramy poprawną odpowiedź z dowolnego pola (answer lub correctAnswer)
  const actualCorrectAnswer = currentQuestion.correctAnswer || (currentQuestion as any).answer;

  const playSound = useCallback((url: string) => {
    const audio = new Audio(url);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, []);

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
      setScore(s => s + 1);
      playSound(SOUNDS.CORRECT);
      onXpChange(10);
    } else {
      playSound(SOUNDS.INCORRECT);
      onXpChange(-2);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      onFinish(score);
    }
  };

  const displayOptions = currentQuestion.options || (currentQuestion.type === 'true_false' ? ['Prawda', 'Fałsz'] : []);

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header */}
      <div className="p-6 md:p-10 flex items-center gap-6 max-w-4xl mx-auto w-full">
        <button onClick={() => onQuit(score, currentIndex)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-8 h-8 text-gray-400" />
        </button>
        <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4 text-center md:text-left">
            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
              {currentQuestion.topic} • Zadanie {currentIndex + 1} z {questions.length}
            </span>
            <h2 className="text-3xl font-black text-gray-800 leading-tight">{currentQuestion.question}</h2>
          </div>

          <div className="grid gap-4">
            {displayOptions.map((option, idx) => {
              const isCorrectOpt = option === actualCorrectAnswer;
              const isSelected = option === selectedOption;
              
              let btnClass = "bg-white border-gray-100 text-gray-700";
              if (isSelected) btnClass = "bg-blue-50 border-blue-400 text-blue-600";
              if (isAnswered) {
                if (isCorrectOpt) btnClass = "bg-green-100 border-green-500 text-green-700";
                else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-700";
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(option)}
                  className={`p-6 text-left text-lg font-bold rounded-[2rem] border-2 transition-all duo-button-shadow ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-blue-50/50 p-8 rounded-[2.5rem] border-2 border-blue-50"
            >
               <h4 className="font-black text-blue-600 uppercase text-[10px] mb-3 flex items-center gap-2 tracking-widest">
                 <Sparkles className="w-4 h-4" /> Wyjaśnienie BioMistrza
               </h4>
               <p className="text-gray-700 font-bold leading-relaxed italic text-sm md:text-base">
                 {currentQuestion.explanation}
               </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className={`p-8 md:p-12 border-t-2 ${!isAnswered ? 'bg-white border-gray-100' : isCorrect ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            {isAnswered && (
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-3xl ${isCorrect ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'} shadow-lg`}>
                  {isCorrect ? <CheckCircle2 className="w-10 h-10 text-white" /> : <AlertCircle className="w-10 h-10 text-white" />}
                </div>
                <div>
                  <h3 className={`text-2xl font-black ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Doskonale!' : 'Poprawna odpowiedź:'}
                  </h3>
                  {!isCorrect && (
                    <p className="font-black text-red-600 text-lg">{actualCorrectAnswer}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={isAnswered ? handleNext : handleCheck}
            disabled={!selectedOption}
            className={`w-full md:w-auto px-16 py-5 rounded-[1.8rem] font-black text-xl uppercase tracking-widest transition-all duo-button-shadow ${
              !selectedOption ? 'bg-gray-100 text-gray-300' : 
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
