// src/data/scienceData.ts

export interface ScienceArticle {
  id: string;
  title: string;
  videoUrl?: string; 
  content: {
    type: 'text' | 'image' | 'tip' | 'header';
    value: string;
  }[];
  miniQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

// ZMIANA TYPU: Record<string, ScienceArticle[]> (Tablica artykułów!)
export const SCIENCE_ARTICLES: Record<string, ScienceArticle[]> = {
  
  // KLUCZ TEMATU (np. topic_single_Woda)
  'topic_Chemia Życia_0': [
    // --- ARTYKUŁ 1 ---
    { 
      id: 'water_intro',
      title: 'Część 1: Budowa Polarna Wody',
      videoUrl: '/owca2.mov', 
      content: [
        { type: 'header', value: 'Dlaczego woda jest wyjątkowa?' },
        { type: 'text', value: 'Woda ($H_2O$) to nie tylko płyn, który pijemy. To medium życia. Jej niezwykłe właściwości wynikają z budowy cząsteczki.' },
        { type: 'header', value: 'Budowa Dipolowa' },
        { type: 'text', value: 'Tlen jest silnie elektroujemny, co oznacza, że przyciąga elektrony mocniej niż wodór. To tworzy ładunek cząstkowy ujemny ($\delta-$) przy tlenie i dodatni ($\delta+$) przy wodorach.' },
        { type: 'tip', value: 'Dzięki temu woda zachowuje się jak mały magnes z dwoma biegunami!' }
      ],
      miniQuiz: {
        question: "Jaki ładunek ma atom tlenu w cząsteczce wody?",
        options: ["Dodatni", "Ujemny", "Obojętny", "Zmienny"],
        correctIndex: 1
      }
    },
    
    // --- ARTYKUŁ 2 ---
    { 
      id: 'water_solvent',
      title: 'Część 2: Woda jako Rozpuszczalnik',
      // Brak wideo w tej części (test placeholdera)
      content: [
        { type: 'header', value: 'Uniwersalny Rozpuszczalnik' },
        { type: 'text', value: 'Dzięki swojej polarności woda potrafi "rozrywać" inne cząsteczki naładowane (np. sól kuchenną $NaCl$).' },
        { type: 'text', value: 'Proces ten nazywamy **hydratacją**. Cząsteczki wody otaczają jony: tleny lgną do kationów ($Na^+$), a wodory do anionów ($Cl^-$).' },
        
        { type: 'tip', value: 'Substancje, które lubią wodę, nazywamy hydrofilowymi. Te, które jej nie lubią (np. tłuszcze), to substancje hydrofobowe.' }
      ],
      miniQuiz: {
        question: "Co to jest hydratacja?",
        options: ["Parowanie wody", "Otaczanie jonów przez cząsteczki wody", "Zamarzanie wody", "Tworzenie wiązań wodorowych"],
        correctIndex: 1
      }
    }
  ],
};
