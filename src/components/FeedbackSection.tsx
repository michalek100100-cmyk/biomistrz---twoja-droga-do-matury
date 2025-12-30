import React, { useState } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig'; // Upewnij się co do ścieżki

const FeedbackSection: React.FC = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim().length < 5) {
      alert("Napisz nam coś więcej (min. 5 znaków).");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      
      await addDoc(collection(db, 'feedback'), {
        uid: user ? user.uid : 'anonymous',
        email: user ? user.email : 'anonymous',
        message: message,
        createdAt: serverTimestamp(),
        platform: 'web',
        userAgent: navigator.userAgent
      });

      alert("Dziękujemy! Twoja opinia trafiła do mnie.");
      setMessage(''); 
    } catch (error) {
      console.error("Błąd wysyłania:", error);
      alert("Wystąpił błąd podczas wysyłania.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12 animate-in fade-in duration-500">
      
      {/* Nagłówek sekcji */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-6">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">Twoja opinia</h2>
        <p className="text-gray-500 font-medium">
          Masz pomysł na nową funkcję? Znalazłeś błąd? <br className="hidden md:block"/>
          Napisz do mnie bezpośrednio.
        </p>
      </div>

      {/* Formularz */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl border-2 border-gray-100 relative overflow-hidden">
        <form onSubmit={handleSubmit} className="relative z-10">
          <label className="block text-xs font-black uppercase text-gray-400 mb-3 tracking-wider">
            Treść wiadomości
          </label>
          
          <textarea
            className="w-full bg-gray-50 rounded-2xl p-4 min-h-[150px] text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none border-2 border-transparent"
            placeholder="Hej! Przydałby się tryb ciemny w aplikacji..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Wysyłanie...</span>
                </>
              ) : (
                <>
                  <span>Wyślij opinię</span>
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dekoracja w tle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      </div>

      <p className="text-center text-gray-300 text-xs mt-8 font-mono">
        ID: {auth.currentUser?.uid || 'Anonim'}
      </p>
    </div>
  );
};

export default FeedbackSection;