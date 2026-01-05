import React, { useState, useEffect } from 'react';
import { NAV_LINKS } from '../constants';
// USUWAMY IMPORT: import Logo from '../public/logo.png';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        
        {/* ZMIANA TUTAJ: Używamy <img> zamiast <Logo> */}
        <div className="flex items-center space-x-3 group cursor-pointer">
          <img 
            src="/logo.png" 
            alt="BioMistrz Logo"
            className="w-12 h-12 transform group-hover:scale-110 transition-transform" 
          />
          <span className={`font-bold text-2xl tracking-tight text-blue-900`}>
            BioMistrz
          </span>
        </div>
        
        <div className="hidden md:flex space-x-8">
          {NAV_LINKS.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-200 active:scale-95">
          Pobierz teraz
        </button>
      </div>
    </nav>
  );
};

export default Navbar;