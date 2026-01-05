import React from 'react';
// ZMIANA 1: Usunąłem nieużywany import (import Logo from './logo.png')

interface HeroProps {
  onAndroidClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onAndroidClick }) => {
  const IOS_LINK = "https://apps.apple.com/pl/app/biomistrz/id6757200264?l=pl";
  
  // ZMIANA 2: Poprawna ścieżka do pliku w folderze public
  // Zamiast "../public/..." wpisujemy po prostu "/nazwa_pliku"
  const SCREENSHOT_URL = "/screenshotapki.jpeg";

  return (
    <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50/30">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-100 rounded-full blur-3xl opacity-30"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 mb-8 text-sm font-bold tracking-wide text-blue-700 uppercase bg-blue-100/80 rounded-2xl border border-blue-200 shadow-sm">
              <span className="mr-2">👑</span> Od maturzysty, dla maturzystów
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-blue-950 leading-[1.1] mb-6">
              Zostań <span className="text-blue-600">BioMistrzem</span> swojej matury
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
              Kompleksowa nauka biologii całkowicie za darmo. Projekt tworzony z pasji, aby każdy miał równe szanse na egzaminie.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-12">
              <div className="flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <span className="text-slate-700 font-bold">100% Za darmo</span>
              </div>
              <div className="flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-slate-700 font-bold">Zero Reklam</span>
              </div>
              <div className="flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                <span className="text-slate-700 font-bold">Brak opłat</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <a 
                href={IOS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 text-center flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.31-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.24-1.99 1.1-3.14-1.01.04-2.24.67-2.97 1.52-.66.76-1.24 1.95-1.08 3.06 1.12.08 2.23-.59 2.95-1.44z"/></svg>
                iOS
              </a>
              <button 
                onClick={onAndroidClick}
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-900 border-2 border-slate-100 hover:border-blue-200 rounded-2xl font-black text-lg shadow-xl shadow-slate-100 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.0601 15.3414 16.6853 14.9666 16.6853 14.5037C16.6853 14.0407 17.0601 13.6659 17.523 13.6659C17.986 13.6659 18.3608 14.0407 18.3608 14.5037C18.3608 14.9666 17.986 15.3414 17.523 15.3414ZM6.47715 15.3414C6.01418 15.3414 5.63941 14.9666 5.63941 14.5037C5.63941 14.0407 6.01418 13.6659 6.47715 13.6659C6.94012 13.6659 7.31489 14.0407 7.31489 14.5037C7.31489 14.9666 6.94012 15.3414 6.47715 15.3414ZM17.8441 11.2386L19.7891 7.86989C19.9239 7.63661 19.8439 7.33777 19.6106 7.20299C19.3773 7.06821 19.0785 7.14818 18.9437 7.38146L16.9691 10.8021C15.4855 10.1226 13.8117 9.74088 12.0001 9.74088C10.1884 9.74088 8.51465 10.1226 7.03108 10.8021L5.05646 7.38146C4.92168 7.14818 4.62284 7.06821 4.38956 7.20299C4.15628 7.33777 4.07631 7.63661 4.21109 7.86989L6.15605 11.2386C3.32997 12.8315 1.41748 15.8202 1.41748 19.2591H22.5827C22.5827 15.8202 20.6702 12.8315 17.8441 11.2386Z"/></svg>
                Android
              </button>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative mt-12 lg:mt-0">
            <div className="relative z-10 bg-white p-4 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border-4 border-blue-50 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="rounded-[1.8rem] overflow-hidden aspect-[9/19] bg-slate-100 max-h-[600px] mx-auto">
                <img 
                  src={SCREENSHOT_URL} 
                  alt="BioMistrz - Podgląd aplikacji" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#FFDD00] p-6 rounded-3xl shadow-xl transform -rotate-6 hidden md:block border-4 border-white">
                <p className="text-blue-950 font-black text-xl leading-none">WSPARCIE<br/>NA 100%</p>
              </div>
            </div>
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;