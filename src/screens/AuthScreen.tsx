import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../components/firebaseConfig'; // Upewnij się, że ścieżka jest dobra
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
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
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-blue-200"
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-blue-200"
          />
          
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-200">
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-gray-400 font-bold text-xs uppercase hover:text-blue-500 transition-colors"
        >
          {isLogin ? 'Nie masz konta? Załóż je' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  );
}