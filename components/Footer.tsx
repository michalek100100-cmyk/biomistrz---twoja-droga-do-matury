
import React from 'react';
import Logo from './Logo';

const Footer: React.FC = () => {
  const COFFEE_LINK = "https://buycoffee.to/biomistrz";

  return (
    <footer id="kontakt" className="bg-slate-50 pt-20 pb-10 border-t border-slate-100">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <Logo className="w-10 h-10" />
              <span className="font-bold text-2xl text-blue-900">BioMistrz</span>
            </div>
            <p className="text-slate-600 max-w-sm mb-8 leading-relaxed">
              Autorski projekt edukacyjny. Tworzony samodzielnie przez maturzystę dla maturzystów, aby nauka biologii była dostępna dla każdego bez opłat.
            </p>
            <div className="flex flex-col gap-3">
              <div className="bg-blue-100/50 p-4 rounded-2xl border border-blue-200/50 inline-block">
                <p className="text-blue-800 font-bold text-sm">
                  Finansowane w 100% z prywatnych środków twórcy.
                </p>
              </div>
              <a 
                href={COFFEE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FFDD00]/20 hover:bg-[#FFDD00]/40 p-4 rounded-2xl border border-[#FFDD00]/50 inline-flex items-center gap-2 transition-colors"
              >
                <span className="text-lg">☕</span>
                <p className="text-blue-950 font-black text-sm uppercase tracking-tight">
                  Wesprzyj projekt na BuyCoffee
                </p>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-black text-blue-950 mb-6 uppercase tracking-wider text-sm">Zasoby</h4>
            <ul className="space-y-4 text-slate-600 font-medium">
              <li><a href="https://docs.google.com/document/d/e/2PACX-1vRlTtVsfqBj7YFibRZXc4QYcZyNu8G1N2Y0GARW2S1fbHXFQaavHqQHQl45NoW7OEahqiJb-0S_S5Eq/pub" className="hover:text-blue-600 transition-colors">Prywatność</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-blue-950 mb-6 uppercase tracking-wider text-sm">Kontakt & Media</h4>
            <ul className="space-y-4 text-slate-600 font-medium">
              <li><a href="mailto:biomistrz@gmail.com" className="hover:text-blue-600 transition-colors font-bold">biomistrz@gmail.com</a></li>
              <li><a href="https://www.instagram.com/biomistrz?igsh=MWY5aHVxbm5hMHA3Nw%3D%3D&utm_source=qr" target="_blank" rel="noopener" className="hover:text-blue-600 transition-colors">Instagram</a></li>
              <li><a href="https://www.tiktok.com/@michaelherbb4?_r=1&_t=ZN-92bWBSSIQwo" target="_blank" rel="noopener" className="hover:text-blue-600 transition-colors">TikTok</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} Michał Ziółczyk. Wszystkie prawa zastrzeżone.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Od maturzysty dla maturzystów</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
