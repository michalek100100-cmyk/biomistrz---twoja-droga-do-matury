
import React, { useState } from 'react';
import Hero from './components/Hero';
import Features from './components/Features';
import Story from './components/Story';
import Footer from './components/Footer';
import Logo from './components/Logo';

const App: React.FC = () => {
  const IOS_LINK = "https://apps.apple.com/pl/app/biomistrz/id6757200264?l=pl";
  const COFFEE_LINK = "https://buycoffee.to/biomistrz";
  const ANDROID_TEST_LINK = "https://play.google.com/store/apps/details?id=com.biomistrz.app&hl=pl";
  const WHATSAPP_LINK = "https://chat.whatsapp.com/LnOYu9mXnfgFWSLQYQuanY";

  const [showAndroidModal, setShowAndroidModal] = useState(false);

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Floating Support Button for desktop */}
      <a 
        href={COFFEE_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#FFDD00] hover:bg-[#ffeb3b] text-blue-900 px-6 py-3 rounded-2xl font-black shadow-2xl transition-all hover:-translate-y-1 flex items-center gap-2 group border-2 border-blue-900/5"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">☕</span>
        <span>Postaw kawę</span>
      </a>

      {/* Android Test Modal */}
      {showAndroidModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <button 
                onClick={() => setShowAndroidModal(false)}
                className="text-slate-400 hover:text-blue-600 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">
                🤖
              </div>
              <h3 className="text-3xl font-black text-blue-950 mb-4">Pobierz na android</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Możesz też dołączyć do grupy testerów którzy mi pomagają na whatsapp! 
              </p>
              <div className="flex flex-col gap-4">
                <a 
                  href={ANDROID_TEST_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.0601 15.3414 16.6853 14.9666 16.6853 14.5037C16.6853 14.0407 17.0601 13.6659 17.523 13.6659C17.986 13.6659 18.3608 14.0407 18.3608 14.5037C18.3608 14.9666 17.986 15.3414 17.523 15.3414ZM6.47715 15.3414C6.01418 15.3414 5.63941 14.9666 5.63941 14.5037C5.63941 14.0407 6.01418 13.6659 6.47715 13.6659C6.94012 13.6659 7.31489 14.0407 7.31489 14.5037C7.31489 14.9666 6.94012 15.3414 6.47715 15.3414ZM17.8441 11.2386L19.7891 7.86989C19.9239 7.63661 19.8439 7.33777 19.6106 7.20299C19.3773 7.06821 19.0785 7.14818 18.9437 7.38146L16.9691 10.8021C15.4855 10.1226 13.8117 9.74088 12.0001 9.74088C10.1884 9.74088 8.51465 10.1226 7.03108 10.8021L5.05646 7.38146C4.92168 7.14818 4.62284 7.06821 4.38956 7.20299C4.15628 7.33777 4.07631 7.63661 4.21109 7.86989L6.15605 11.2386C3.32997 12.8315 1.41748 15.8202 1.41748 19.2591H22.5827C22.5827 15.8202 20.6702 12.8315 17.8441 11.2386Z"/></svg>
                  Sklep Google Play
                </a>
                <a 
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.277l-.582 2.128 2.185-.573c.963.524 1.907.866 3.147.867 3.18 0 5.765-2.587 5.766-5.766 0-3.181-2.586-5.767-5.767-5.767zm3.39 8.213c-.147.414-.716.757-1.157.822-.394.057-.91.077-1.465-.102-.34-.11-.758-.266-1.295-.494-2.288-.973-3.766-3.297-3.879-3.449-.113-.151-.92-1.223-.92-2.335 0-1.11.583-1.657.791-1.882.208-.225.454-.282.604-.282.15 0 .301.001.432.007.137.006.321-.052.502.386.182.439.622 1.512.678 1.625.056.113.093.245.018.395-.075.151-.114.245-.226.377-.113.132-.236.294-.339.395-.113.113-.231.236-.099.462.132.226.587.967 1.26 1.567.867.773 1.598 1.013 1.825 1.126.226.113.358.094.49-.057.132-.151.565-.659.716-.885.151-.226.301-.189.508-.113.208.075 1.32.622 1.546.735.226.113.377.17.433.264.056.094.056.546-.151.959zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.655 1.442 5.155L2 22l4.99-.1.01.01C8.448 22.486 10.163 23 12 23c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                  Grupa WhatsApp Testerów
                </a>
                <button 
                  onClick={() => setShowAndroidModal(false)}
                  className="text-slate-400 font-bold hover:text-slate-600 transition-colors pt-2"
                >
                  Wróć później
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main>
        <Hero onAndroidClick={() => setShowAndroidModal(true)} />
        
        {/* Quick Slogan Bar */}
        <div className="bg-blue-600 py-6 overflow-hidden">
          <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] md:justify-around text-white font-bold text-xl lg:text-2xl uppercase tracking-widest opacity-90">
            <span className="mx-12">Za darmo</span>
            <span className="mx-12">Bez reklam</span>
            <span className="mx-12">Bez mikropłatności</span>
            <span className="mx-12">Od maturzysty dla maturzystów</span>
            {/* Repeat for seamless scroll effect */}
            <span className="mx-12">Za darmo</span>
            <span className="mx-12">Bez reklam</span>
            <span className="mx-12">Bez mikropłatności</span>
            <span className="mx-12">Od maturzysty dla maturzystów</span>
          </div>
        </div>

        <Features />
        <Story />

        {/* Support Section */}
        <section className="py-20 bg-blue-50/50">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-6">
                <span className="text-4xl">☕</span>
              </div>
              <h2 className="text-3xl font-black text-blue-950 mb-4">Podoba Ci się projekt?</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                BioMistrz jest tworzony całkowicie za darmo i z własnych środków. Jeśli aplikacja pomaga Ci w nauce, możesz wesprzeć jej rozwój stawiając mi symboliczną kawę. Każda wpłata pomaga utrzymać serwery i dodawać nowe funkcje!
              </p>
              <a 
                href={COFFEE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#FFDD00] hover:bg-[#ffeb3b] text-blue-950 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95"
              >
                Wesprzyj projekt na buycoffee.to
              </a>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-24 bg-white text-center">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto bg-blue-600 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-blue-200">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-400 rounded-full translate-x-1/3 translate-y-1/3 opacity-30"></div>
              
              <div className="relative z-10 text-white">
                <Logo className="w-20 h-20 mx-auto mb-8 bg-white p-2 rounded-3xl" />
                <h2 className="text-4xl md:text-5xl font-black mb-6">Gotowy na maturę?</h2>
                <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                  Pobierz BioMistrza już dziś i dołącz do maturzystów, którzy stawiają na skuteczną naukę.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <a 
                    href={IOS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-10 py-5 bg-white text-blue-600 hover:bg-blue-50 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.31-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.24-1.99 1.1-3.14-1.01.04-2.24.67-2.97 1.52-.66.76-1.24 1.95-1.08 3.06 1.12.08 2.23-.59 2.95-1.44z"/></svg>
                    Pobierz na iOS
                  </a>
                  <button 
                    onClick={() => setShowAndroidModal(true)}
                    className="flex items-center justify-center gap-3 px-10 py-5 bg-blue-800 text-white hover:bg-blue-900 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 border-2 border-blue-400/20"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.0601 15.3414 16.6853 14.9666 16.6853 14.5037C16.6853 14.0407 17.0601 13.6659 17.523 13.6659C17.986 13.6659 18.3608 14.0407 18.3608 14.5037C18.3608 14.9666 17.986 15.3414 17.523 15.3414ZM6.47715 15.3414C6.01418 15.3414 5.63941 14.9666 5.63941 14.5037C5.63941 14.0407 6.01418 13.6659 6.47715 13.6659C6.94012 13.6659 7.31489 14.0407 7.31489 14.5037C7.31489 14.9666 6.94012 15.3414 6.47715 15.3414ZM17.8441 11.2386L19.7891 7.86989C19.9239 7.63661 19.8439 7.33777 19.6106 7.20299C19.3773 7.06821 19.0785 7.14818 18.9437 7.38146L16.9691 10.8021C15.4855 10.1226 13.8117 9.74088 12.0001 9.74088C10.1884 9.74088 8.51465 10.1226 7.03108 10.8021L5.05646 7.38146C4.92168 7.14818 4.62284 7.06821 4.38956 7.20299C4.15628 7.33777 4.07631 7.63661 4.21109 7.86989L6.15605 11.2386C3.32997 12.8315 1.41748 15.8202 1.41748 19.2591H22.5827C22.5827 15.8202 20.6702 12.8315 17.8441 11.2386Z"/></svg>
                    Pobierz na Android
                  </button>
                </div>
                <p className="mt-10 text-sm text-blue-200 font-bold uppercase tracking-widest">
                  Bez reklam • Bez opłat • Słowo maturzysty
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default App;
