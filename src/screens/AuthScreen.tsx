import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../components/firebaseConfig';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

// Stała z Twoim linkiem
const POLICY_URL = "https://docs.google.com/document/d/e/2PACX-1vRlTtVsfqBj7YFibRZXc4QYcZyNu8G1N2Y0GARW2S1fbHXFQaavHqQHQl45NoW7OEahqiJb-0S_S5Eq/pub";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Nowy stan do checkboxa
  const [acceptPolicy, setAcceptPolicy] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // WALIDACJA POLITYKI PRYWATNOŚCI
    // Sprawdzamy tylko przy rejestracji (!isLogin)
    if (!isLogin && !acceptPolicy) {
      setError("Aby utworzyć konto, musisz zaakceptować Politykę Prywatności.");
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      // Tłumaczenie błędów Firebase na polski (opcjonalne, dla lepszego UX)
      if (err.code === 'auth/email-already-in-use') {
        setError("Ten email jest już zajęty.");
      } else if (err.code === 'auth/weak-password') {
        setError("Hasło musi mieć min. 6 znaków.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Błędny email lub hasło.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border-2 border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 mb-2">BioMistrz</h1>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
            {isLogin ? 'Witaj ponownie!' : 'Rozpocznij naukę'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-blue-200 transition-all"
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-blue-200 transition-all"
          />
          
          {/* CHECKBOX POLITYKI PRYWATNOŚCI (Tylko przy rejestracji) */}
          {!isLogin && (
            <div className="flex items-start gap-3 px-2 py-2">
              <input 
                type="checkbox" 
                id="policy-check"
                checked={acceptPolicy}
                onChange={(e) => setAcceptPolicy(e.target.checked)}
                className="mt-1 w-5 h-5 accent-blue-600 cursor-pointer rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="policy-check" className="text-xs text-gray-500 font-bold leading-relaxed cursor-pointer select-none">
                Zapoznałem/am się i akceptuję{' '}
                <a 
                  href={POLICY_URL} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 transition-colors"
                  onClick={(e) => e.stopPropagation()} // Żeby kliknięcie w link nie przełączało checkboxa (opcjonalne)
                >
                  Politykę Prywatności
                </a>
                {' '}aplikacji BioMistrz.
              </label>
            </div>
          )}

          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-200 mt-2">
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setError(''); // Czyścimy błędy przy przełączaniu
            setAcceptPolicy(false); // Resetujemy checkbox
          }}
          className="w-full mt-4 text-gray-400 font-bold text-xs uppercase hover:text-blue-500 transition-colors"
        >
          {isLogin ? 'Nie masz konta? Załóż je' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  );
}