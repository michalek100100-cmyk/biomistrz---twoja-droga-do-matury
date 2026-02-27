import React, { useState } from 'react';
import { Send, MessageSquare, Loader2, Star } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { useLanguage } from '../contexts/LanguageContext';

const FeedbackSection: React.FC = () => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<'bug' | 'improvement' | 'idea' | 'other'>('idea');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim().length < 5) {
      alert(t.feedback.minLengthError);
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;

      await addDoc(collection(db, 'feedback'), {
        uid: user ? user.uid : 'anonymous',
        email: user ? user.email : 'anonymous',
        message: message,
        rating: rating,
        category: category,
        createdAt: serverTimestamp(),
        platform: 'web',
        userAgent: navigator.userAgent
      });

      alert(t.feedback.success);
      setMessage('');
      setRating(0);
    } catch (error) {
      console.error("Błąd wysyłania:", error);
      alert(t.feedback.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12 animate-in fade-in duration-500">

      {/* Nagłówek sekcji */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-6 italic">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">{t.feedback.title}</h2>
        <p className="text-gray-500 font-medium">
          {t.feedback.desc}
        </p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border-2 border-gray-100 relative overflow-hidden">
        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">

          {/* Rating */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase text-gray-400 tracking-wider">
              {t.feedback.ratingLabel}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-all active:scale-90"
                >
                  <Star
                    className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    strokeWidth={star <= rating ? 0 : 2}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase text-gray-400 tracking-wider">
              {t.feedback.categoryLabel}
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {(['bug', 'improvement', 'idea', 'other'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${category === cat
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  {t.feedback.categories[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase text-gray-400 tracking-wider">
              {t.feedback.messageLabel}
            </label>
            <textarea
              className="w-full bg-gray-50 rounded-2xl p-4 min-h-[150px] text-gray-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none border-2 border-transparent"
              placeholder={t.feedback.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.feedback.submitting}</span>
                </>
              ) : (
                <>
                  <span>{t.feedback.submit}</span>
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