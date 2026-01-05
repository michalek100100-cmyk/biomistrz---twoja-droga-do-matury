
import React from 'react';
import { FEATURES } from '../constants';

const Features: React.FC = () => {
  return (
    <section id="funkcje" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Wszystko, czego potrzebujesz</h2>
          <p className="text-lg text-slate-600">
            BioMistrz to nie tylko baza wiedzy. To Twój osobisty asystent w drodze do wymarzonych studiów medycznych czy gdziekolwiek zechcesz!
          </p>
        </div>

        <div className="grid md:grid-rows-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-blue-50 hover:bg-blue-100 transition-colors group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon}></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
