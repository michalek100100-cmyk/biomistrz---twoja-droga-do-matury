import React from 'react';

// UWAGA: Usunąłem linię "import ... from ...".
// Gdy plik jest w folderze 'public', nie trzeba go importować na górze.

const Story: React.FC = () => {

  return (
    <section id="moja-misja" className="py-24 bg-blue-900 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <svg width="400" height="400" viewBox="0 0 100 100" fill="white">
          <path d="M50 0 L100 50 L50 100 L0 50 Z" />
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">Dlaczego to robię?</h2>
            <div className="space-y-6 text-blue-100 text-lg leading-relaxed">
              <p>
                Sam niedawno byłem w tym samym miejscu co Ty. Stosy kserówek, drogie kursy i aplikacje, które po trzech dniach wołają o subskrypcję Premium.
              </p>
              <p>
                Postanowiłem to zmienić. BioMistrz to projekt, który prowadzę <strong className="text-white italic underline decoration-amber-400 decoration-2 underline-offset-4">całkowicie sam</strong>. Po nocach koduję, a w dzień opracowuję materiały merytoryczne.
              </p>
              <p className="bg-blue-800/40 p-6 rounded-3xl border border-blue-700 shadow-inner">
                Całość finansuję z <strong className="text-white">własnych oszczędności</strong>. Bez inwestorów, bez reklamodawców. Moim jedynym celem jest to, aby każdy maturzysta miał dostęp do najwyższej jakości wiedzy zupełnie za darmo. 
              </p>
              <p>
                To moja cegiełka dla przyszłych pokoleń medyków, weterynarzy czy naukowców. BioMistrz to dowód na to, że od maturzysty dla maturzystów można stworzyć coś wielkiego.
              </p>
            </div>
          </div>
          
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-400 to-blue-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-72 h-72 lg:w-96 lg:h-96 rounded-full overflow-hidden border-8 border-blue-800 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                
                {/* ZMIANA:
                    Zamiast zmiennej {michalPhoto}, wpisujemy ścieżkę tekstową "/michal.jpeg".
                    Slash "/" na początku mówi przeglądarce: "szukaj w folderze publicznym".
                */}
                <img 
                  src="/michal.jpeg" 
                  alt="Michał - Twórca BioMistrza" 
                  className="w-full h-full object-cover object-center scale-110"
                />

              </div>
              <div className="absolute -bottom-4 -right-4 bg-amber-400 text-blue-900 font-black px-8 py-4 rounded-2xl shadow-xl transform rotate-3 z-20 hover:rotate-0 transition-transform cursor-default">
                Michał - Twórca BioMistrza
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;