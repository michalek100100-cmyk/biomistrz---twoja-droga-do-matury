import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../components/firebaseConfig';
import { LogIn, UserPlus, AlertCircle, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Stała z Twoim linkiem
const POLICY_URL = "https://docs.google.com/document/d/e/2PACX-1vRlTtVsfqBj7YFibRZXc4QYcZyNu8G1N2Y0GARW2S1fbHXFQaavHqQHQl45NoW7OEahqiJb-0S_S5Eq/pub";

export default function AuthScreen() {
  const { t } = useLanguage();
  const a = t.auth;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const [acceptPolicy, setAcceptPolicy] = useState(false);

  // Rate limiting states
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return Number(localStorage.getItem('auth_failed_attempts')) || 0;
  });
  const [cooldownUntil, setCooldownUntil] = useState(() => {
    return Number(localStorage.getItem('auth_cooldown_until')) || 0;
  });
  const [remainingCooldown, setRemainingCooldown] = useState(0);

  // Cooldown countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateCountdown = () => {
      const now = Date.now();
      if (cooldownUntil > now) {
        setRemainingCooldown(Math.ceil((cooldownUntil - now) / 1000));
      } else {
        setRemainingCooldown(0);
        if (cooldownUntil !== 0) {
          setCooldownUntil(0);
          localStorage.removeItem('auth_cooldown_until');
        }
      }
    };

    updateCountdown();
    interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (remainingCooldown > 0) {
      setError(a.errorTooManyAttempts.replace('$1', remainingCooldown.toString()));
      return;
    }

    // WALIDACJA REJESTRACJI
    if (!isLogin) {
      // Limit kont na urządzenie
      const registeredAccounts = JSON.parse(localStorage.getItem('registered_accounts') || '[]');
      if (registeredAccounts.length >= 3) {
        setError(a.errorAccountLimit);
        return;
      }

      if (!name.trim()) {
        setError(a.errorNameRequired);
        return;
      }
      if (!acceptPolicy) {
        setError(a.errorPolicyRequired);
        return;
      }
    }

    try {
      if (isLogin) {
        // --- LOGOWANIE ---
        await signInWithEmailAndPassword(auth, email, password);
        // Reset count on success
        setFailedAttempts(0);
        localStorage.removeItem('auth_failed_attempts');

        // Dodaj do listy kont na urządzeniu (jeśli go tam nie ma)
        const registeredAccounts = JSON.parse(localStorage.getItem('registered_accounts') || '[]');
        if (auth.currentUser && !registeredAccounts.includes(auth.currentUser.uid)) {
          registeredAccounts.push(auth.currentUser.uid);
          localStorage.setItem('registered_accounts', JSON.stringify(registeredAccounts));
        }
      } else {
        // --- REJESTRACJA ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        await setDoc(doc(db, 'users', user.uid), {
          stats: {
            name: name,
            xp: 0,
            gems: 100,
            streak: 1,
            avatar: ''
          },
          lastActive: new Date().toISOString()
        });

        // Dodaj do listy kont na urządzeniu
        const registeredAccounts = JSON.parse(localStorage.getItem('registered_accounts') || '[]');
        if (!registeredAccounts.includes(user.uid)) {
          registeredAccounts.push(user.uid);
          localStorage.setItem('registered_accounts', JSON.stringify(registeredAccounts));
        }
      }
    } catch (err: any) {
      if (isLogin) {
        const newCount = failedAttempts + 1;
        setFailedAttempts(newCount);
        localStorage.setItem('auth_failed_attempts', newCount.toString());

        let delay = 0;
        if (newCount === 5) delay = 10000;
        else if (newCount === 6) delay = 30000;
        else if (newCount >= 7) delay = 60000;

        if (delay > 0) {
          const until = Date.now() + delay;
          setCooldownUntil(until);
          localStorage.setItem('auth_cooldown_until', until.toString());
          setError(a.errorTooManyAttempts.replace('$1', (delay / 1000).toString()));
          return;
        }
      }

      if (err.code === 'auth/email-already-in-use') {
        setError(a.errorEmailInUse);
      } else if (err.code === 'auth/weak-password') {
        setError(a.errorWeakPassword);
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-email' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError(a.errorInvalidCredential);
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border-2 border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 mb-2">{a.title}</h1>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
            {isLogin ? a.welcomeBack : a.createAccount}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">

          {/* POLE NAZWY UŻYTKOWNIKA - Widoczne tylko przy rejestracji */}
          {!isLogin && (
            <div className="relative animate-in fade-in slide-in-from-top-2">
              <input
                type="text"
                placeholder={a.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 pl-12 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-blue-200 transition-all"
                maxLength={15}
              />
              <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          )}

          <input
            type="email"
            placeholder={a.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-blue-200 transition-all"
          />
          <input
            type="password"
            placeholder={a.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-blue-200 transition-all"
          />

          {/* CHECKBOX POLITYKI */}
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
                {a.policyPrefix}
                <a
                  href={POLICY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {a.policyLink}
                </a>
                {a.policySuffix}
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={remainingCooldown > 0}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-200 mt-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin
              ? (remainingCooldown > 0 ? a.waitButton.replace('$1', remainingCooldown.toString()) : a.loginButton)
              : a.registerButton}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setAcceptPolicy(false);
            setName('');
          }}
          className="w-full mt-4 text-gray-400 font-bold text-xs uppercase hover:text-blue-500 transition-colors"
        >
          {isLogin ? a.switchToRegister : a.switchToLogin}
        </button>
      </div>
    </div>
  );
}