import React, { useState } from 'react';
import { db, auth } from './firebaseConfig'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Bug, X, Send, Loader2 } from 'lucide-react';

const BugReportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);

    try {
      // Zbieramy podstawowe dane
      const user = auth.currentUser;
      
      await addDoc(collection(db, 'reports'), {
        description: text,
        userEmail: user?.email || 'Anonim',
        userId: user?.uid || 'no-id',
        createdAt: serverTimestamp(),
        deviceInfo: navigator.userAgent, // Informacja o przeglądarce/telefonie
        status: 'new' // Status zgłoszenia
      });

      alert("Dzięki! Zgłoszenie zostało wysłane. 🫡");
      setText('');
      setIsOpen(false);
    } catch (error) {
      console.error("Błąd wysyłania:", error);
      alert("Nie udało się wysłać zgłoszenia. Sprawdź internet.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* 1. PŁYWAJĄCY PRZYCISK (Widoczny zawsze) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg shadow-red-500/40 transition-transform active:scale-90 flex items-center justify-center"
        title="Zgłoś błąd"
      >
        <Bug className="w-6 h-6" />
      </button>

      {/* 2. MODAL (Okienko z formularzem) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            
            {/* Nagłówek */}
            <div className="bg-red-500 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Bug className="w-5 h-5" /> Zgłoś problem
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formularz */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Zauważyłeś błąd? Napisz co się stało, a my to naprawimy! 🔧
              </p>
              
              <textarea
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-32 text-sm bg-gray-50"
                placeholder="Np. Klikam w zadanie nr 3 i aplikacja się zamyka..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all w-full justify-center"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Wysyłanie...
                    </>
                  ) : (
                    <>
                      Wyślij zgłoszenie <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
};

export default BugReportButton;