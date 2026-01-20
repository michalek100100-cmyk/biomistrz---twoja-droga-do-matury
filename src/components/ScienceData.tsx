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
{
    id: 'water-structure-deep-01',
    title: 'Budowa cząsteczki wody i wiązania wodorowe',
    videoUrl: 'https://drive.google.com/file/d/11vEZol9L_EEf6lHLC1KBmjJUAsJ79Ods/preview',
    content: [
      { type: 'header', value: 'Polarność cząsteczki' },
      { type: 'text', value: 'Woda (H₂O) jest związkiem kowalencyjnym spolaryzowanym. Wynika to z różnicy elektroujemności między atomem tlenu a atomami wodoru. Tlen silniej przyciąga wspólną parę elektronową, zyskując cząstkowy ładunek ujemny (δ-), podczas gdy wodory zyskują cząstkowy ładunek dodatni (δ+).' },
      { type: 'text', value: 'Budowa ta sprawia, że cząsteczka wody jest dipolem elektrycznym. To właśnie ten moment dipolowy odpowiada za większość unikalnych właściwości wody.' },
      { type: 'header', value: 'Wiązania wodorowe – klucz do życia' },
      { type: 'text', value: 'Dzięki polarności, cząsteczki wody przyciągają się wzajemnie. Dodatni atom wodoru jednej cząsteczki jest przyciągany przez ujemny atom tlenu innej cząsteczki. Tak powstaje wiązanie wodorowe.' },
      { type: 'text', value: 'Pojedyncze wiązanie wodorowe jest słabe i nietrwałe (powstaje i zrywa się w ułamkach sekund), ale ich ogromna liczba w objętości wody nadaje jej niezwykłą stabilność i strukturę sieciową.' },
      { type: 'tip', value: 'Matura: Pamiętaj, że wiązania kowalencyjne są WEWNĄTRZ cząsteczki (między O a H), a wiązania wodorowe są MIĘDZY cząsteczkami.' }
    ],
    miniQuiz: {
      question: "Który atom w cząsteczce wody posiada cząstkowy ładunek ujemny (δ-)?",
      options: ["Wodór, ze względu na niską elektroujemność", "Tlen, ze względu na wysoką elektroujemność", "Oba atomy są obojętne", "Węgiel (jeśli występuje jako zanieczyszczenie)"],
      correctIndex: 1
    }
  },

  // --- ARTYKUŁ 2: ROZPUSZCZALNOŚĆ I ŚRODOWISKO REAKCJI ---
  {
    id: 'water-solvent-deep-02',
    title: 'Woda jako rozpuszczalnik i środowisko reakcji',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Mechanizm rozpuszczania (Solwatacja)' },
      { type: 'text', value: 'Woda jest nazywana uniwersalnym rozpuszczalnikiem dla substancji polarnych (hydrofilowych). Proces ten polega na otaczaniu cząsteczek substancji rozpuszczanej przez cząsteczki wody – zjawisko to nazywamy hydratacją (rodzaj solwatacji).' },
      { type: 'text', value: 'Woda doskonale rozpuszcza:' },
      { type: 'text', value: '- Związki jonowe (np. sole mineralne), powodując ich dysocjację elektrolityczną.' },
      { type: 'text', value: '- Związki polarne niejonowe (np. cukry proste, niektóre aminokwasy, alkohole) dzięki tworzeniu z nimi wiązań wodorowych.' },
      { type: 'header', value: 'Interakcje hydrofobowe' },
      { type: 'text', value: 'Substancje niepolarne (np. tłuszcze) są hydrofobowe ("boją się wody"). W środowisku wodnym cząsteczki te dążą do agregacji (zbijania się w grupy), aby zminimalizować kontakt z wodą. Jest to kluczowe np. przy tworzeniu błon biologicznych z fosfolipidów.' },
      { type: 'header', value: 'Znaczenie biologiczne' },
      { type: 'text', value: 'Jako środowisko reakcji, woda umożliwia hydrolizę (rozpad cząsteczek z udziałem wody) oraz jest produktem reakcji kondensacji. Stanowi główny składnik cytozolu, co pozwala na dyfuzję substratów do enzymów.' }
    ],
    miniQuiz: {
      question: "Czym jest zjawisko hydratacji?",
      options: ["Rozpadem cząsteczki wody na jony", "Otaczaniem jonów lub cząsteczek przez dipole wody", "Syntezą wody w łańcuchu oddechowym", "Parowaniem wody z powierzchni liścia"],
      correctIndex: 1
    }
  },

  // --- ARTYKUŁ 3: TRANSPORT I NAPIĘCIE POWIERZCHNIOWE ---
  {
    id: 'water-transport-deep-03',
    title: 'Kohezja, adhezja i transport płynów',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Kohezja i Adhezja – definicje rozszerzone' },
      { type: 'text', value: 'Kohezja (spójność) to siła wzajemnego przyciągania między cząsteczkami tej samej substancji (woda-woda) dzięki wiązaniom wodorowym. Adhezja to siła przyciągania między cząsteczkami wody a powierzchniami naładowanymi elektrycznie (np. celulozowe ściany komórkowe roślin).' },
      { type: 'header', value: 'Mechanizm transportu u roślin' },
      { type: 'text', value: 'Woda w naczyniach drewna (ksylemu) tworzy nieprzerwany słup. Jest to możliwe dzięki kohezji, która zapobiega rozerwaniu słupa cieczy pod wpływem grawitacji. Adhezja pozwala wodzie "wspinać się" po ścianach naczyń (włoskowatość).' },
      { type: 'text', value: 'Teoria transpiracyjno-kohezyjno-napięciowa wyjaśnia, że parowanie wody z liści (transpiracja) wytwarza podciśnienie (siłę ssącą), które pociąga cały słup wody w górę rośliny.' },
      { type: 'header', value: 'Napięcie powierzchniowe' },
      { type: 'text', value: 'Na styku fazy wodnej i powietrznej cząsteczki wody są silniej przyciągane do wnętrza cieczy niż do powietrza. Tworzy to "sprężystą błonę" na powierzchni. Dzięki temu lekkie owady (np. nartniki) mogą poruszać się po powierzchni wody, nie tonąc.' }
    ],
    miniQuiz: {
      question: "Które zjawisko zapobiega przerwaniu słupa wody w naczyniach roślinnych?",
      options: ["Adhezja", "Kohezja", "Grawitacja", "Transpiracja"],
      correctIndex: 1
    }
  },

  // --- ARTYKUŁ 4: WŁAŚCIWOŚCI TERMICZNE ---
  {
    id: 'water-thermal-deep-04',
    title: 'Termoregulacja i stabilizacja temperatury',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Wysokie ciepło właściwe' },
      { type: 'text', value: 'Woda ma jedno z najwyższych ciepeł właściwych wśród znanych substancji (ok. 4184 J/kg·K). Oznacza to, że aby podnieść temperaturę wody o 1°C, trzeba dostarczyć bardzo dużo energii. Dlaczego? Ponieważ znaczna część energii cieplnej jest zużywana najpierw na rozerwanie wiązań wodorowych, a dopiero potem na zwiększenie energii kinetycznej cząsteczek.' },
      { type: 'text', value: 'Biologiczny skutek: Organizm nie ulega gwałtownemu przegrzaniu ani wychłodzeniu. Woda działa jak bufor termiczny, zapewniając homeostazę.' },
      { type: 'header', value: 'Wysokie ciepło parowania' },
      { type: 'text', value: 'Przejście wody ze stanu ciekłego w gazowy wymaga rozerwania wszystkich wiązań wodorowych utrzymujących cząsteczkę w cieczy. Organizm, wydzielając pot (człowiek) lub transpirując (rośliny), "oddaje" cząsteczki wody, które zabierają ze sobą nadmiar energii cieplnej.' },
      { type: 'tip', value: 'Ważne: Pot chłodzi organizm tylko wtedy, gdy PARUJE. Spływający pot nie obniża temperatury ciała efektywnie.' }
    ],
    miniQuiz: {
      question: "Dlaczego woda ma tak wysokie ciepło właściwe?",
      options: ["Przez niską masę cząsteczkową", "Ponieważ energia jest zużywana na zrywanie wiązań wodorowych", "Przez brak polarności", "Ponieważ woda jest gęstsza od lodu"],
      correctIndex: 1
    }
  },

  // --- ARTYKUŁ 5: GĘSTOŚĆ I MECHANIKA ---
  {
    id: 'water-density-mechanics-05',
    title: 'Anomalia gęstości i funkcje mechaniczne',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Anomalia gęstości wody' },
      { type: 'text', value: 'Większość substancji kurczy się i zwiększa gęstość podczas krzepnięcia. Woda zachowuje się inaczej. Największą gęstość osiąga w temperaturze +4°C. Poniżej tej temperatury cząsteczki wody zaczynają formować regularną sieć krystaliczną (lód), w której odległości między cząsteczkami są większe niż w cieczy.' },
      { type: 'text', value: 'Skutek: Lód jest lżejszy od wody i unosi się na powierzchni. Tworzy warstwę izolacyjną, chroniąc głębsze warstwy zbiornika przed zamarzaniem. Umożliwia to przetrwanie ryb i innych organizmów wodnych zimą przy dnie, gdzie woda ma stałe 4°C.' },
      { type: 'header', value: 'Mała ściśliwość i turgor' },
      { type: 'text', value: 'Woda w stanie ciekłym jest praktycznie nieściśliwa. W komórkach roślinnych woda gromadzona w wakuoli wywiera ciśnienie na ścianę komórkową – jest to ciśnienie turgorowe.' },
      { type: 'text', value: 'Turgor odpowiada za jędrność tkanek niezdrewniałych, otwieranie aparatów szparkowych oraz wzrost wydłużeniowy komórek.' }
    ],
    miniQuiz: {
      question: "W jakiej temperaturze woda ma największą gęstość?",
      options: ["0°C", "100°C", "4°C", "-4°C"],
      correctIndex: 2
    }
  }
  ],
   'topic_Chemia Życia_1': [
  {
    id: 'biogenic-basics-01',
    title: 'Pierwiastki biogenne – fundament materii organicznej',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Wielka szóstka: C, H, O, N, P, S' },
      { type: 'text', value: 'Pierwiastki biogenne to grupa pierwiastków, które stanowią główny składnik związków organicznych budujących wszystkie organizmy żywe. Należą do nich: Węgiel (C), Wodór (H), Tlen (O), Azot (N), Fosfor (P) i Siarka (S). Łącznie stanowią one około 98% masy każdego organizmu.' },
      { type: 'header', value: 'Kluczowa rola węgla (C)' },
      { type: 'text', value: 'Węgiel jest uważany za pierwiastek życia ze względu na swoje unikalne właściwości chemiczne. Jest czterowartościowy, co oznacza, że może tworzyć aż cztery silne i stabilne wiązania kowalencyjne z innymi atomami. Pozwala to na budowanie długich, prostych lub rozgałęzionych łańcuchów oraz pierścieni. Stanowią one trwały "szkielet" dla białek, lipidów i cukrów.' },
      { type: 'header', value: 'Tlen (O) i Wodór (H)' },
      { type: 'text', value: 'Są to pierwiastki wszechobecne. Tworzą wodę – środowisko życia, ale też wchodzą w skład grup funkcyjnych (np. hydroksylowych -OH). Biorą udział w kluczowych reakcjach redoks (utleniania i redukcji) w mitochondriach.' },
      { type: 'header', value: 'Azot (N) i Siarka (S) – składniki białek' },
      { type: 'text', value: 'Azot jest niezbędny do życia, ponieważ buduje grupy aminowe w aminokwasach (budulec białek) oraz zasady azotowe w kwasach nukleinowych (DNA i RNA).' },
      { type: 'text', value: 'Siarka (S) występuje w dwóch ważnych aminokwasach: metioninie i cysteinie.  Kluczową funkcją siarki jest tworzenie tzw. mostków dwusiarczkowych (-S-S-) pomiędzy cząsteczkami cysteiny. Mostki te stabilizują trzeciorzędową strukturę białka, czyli utrzymują jego odpowiedni kształt przestrzenny (np. w enzymach czy przeciwciałach).' },
      { type: 'tip', value: 'Zapamiętaj: Azot i Siarka to para, która "spotyka się" w białkach. Fosforu w białkach zazwyczaj nie ma (z wyjątkiem fosforylacji), za to jest kluczowy w DNA.' }
    ],
    miniQuiz: {
      question: "Który pierwiastek odpowiada za tworzenie mostków stabilizujących strukturę przestrzenną białek?",
      options: ["Węgiel", "Azot", "Siarka", "Fosfor"],
      correctIndex: 2
    }
  },

  // --- ARTYKUŁ 2: FOSFOR (P) - ENERGIA I PH ---
  {
    id: 'phosphorus-energy-02',
    title: 'Fosfor – nośnik energii i strażnik pH',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Fosfor w energetyce komórki (ATP)' },
      { type: 'text', value: 'Fosfor (P) nie występuje w organizmie w stanie wolnym, lecz głównie jako jony fosforanowe. Jest kluczowym składnikiem ATP (adenozynotrifosforanu). Energia w ATP magazynowana jest w tzw. wysokoenergetycznych wiązaniach fosforanowych. Rozpad tych wiązań uwalnia energię niezbędną do procesów życiowych (np. skurczu mięśni).' },
      { type: 'header', value: 'Rola buforująca' },
      { type: 'text', value: 'Jony fosforanowe pełnią funkcję bufora we krwi i cytozolu. Oznacza to, że pomagają utrzymać stałe pH płynów ustrojowych, neutralizując nadmiar kwasów lub zasad.' },
      { type: 'header', value: 'Fosfor u roślin' },
      { type: 'text', value: 'Rośliny nie mogą wchłonąć fosforu organicznego. Pobierają go z roztworu glebowego wyłącznie w formie nieorganicznych jonów fosforanowych (V).' },
      { type: 'tip', value: 'Skojarz: Fosfor = ATP (Energia) + DNA (Szkielet cukrowo-fosforanowy) + Kości (Hydroksyapatyt).' }
    ],
    miniQuiz: {
      question: "W jakiej postaci rośliny pobierają fosfor z gleby?",
      options: ["Jako czysty pierwiastek", "Jako jony fosforanowe", "Jako fosfolipidy", "Jako jony węglanowe"],
      correctIndex: 1
    }
  },

  // --- ARTYKUŁ 3: WAPŃ (Ca) i MAGNEZ (Mg) ---
  {
    id: 'calcium-magnesium-03',
    title: 'Makroelementy budulcowe i aktywatory: Ca i Mg',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Wapń (Ca) – Kości i sygnały' },
      { type: 'text', value: 'Aż 99% wapnia w organizmie człowieka znajduje się w kościach i zębach, gdzie w postaci hydroksyapatytu nadaje im twardość. Pozostały 1% krążący we krwi pełni jednak funkcje krytyczne:' },
      { type: 'text', value: '1. Skurcz mięśni: Jony Ca²⁺ są sygnałem, który "odblokowuje" możliwość przesunięcia włókien mięśniowych.\n2. Krzepnięcie krwi: Wapń jest niezbędnym czynnikiem w kaskadzie krzepnięcia (bez niego krew nie skrzepnie).' },
      { type: 'header', value: 'Magnez (Mg) – Aktywator enzymów' },
      { type: 'text', value: 'Magnez to "król aktywatorów". Jest niezbędny dla działania setek enzymów, zwłaszcza tych, które zajmują się produkcją i zużyciem energii (ATP). Stabilizuje również strukturę rybosomów (odpowiedzialnych za syntezę białek), zapobiegając ich rozpadowi na podjednostki.' },
      { type: 'header', value: 'Magnez u roślin – Chlorofil' },
      { type: 'text', value: 'To, co dla naszej krwi robi żelazo (w hemoglobinie), dla roślin robi magnez.  Magnez znajduje się w samym centrum cząsteczki chlorofilu. Bez niego rośliny nie mogą przeprowadzać fotosyntezy. Niedobór magnezu u roślin objawia się chlorozą (żółknięciem liści).' },
      { type: 'tip', value: 'Matura: Pamiętaj, że wapń działa ZEWNĄTRZkomórkowo i w kościach, a magnez działa głównie WEWNĄTRZ komórek (enzymy, DNA, rybosomy).' }
    ],
    miniQuiz: {
      question: "Jaka jest rola magnezu specyficzna tylko dla roślin?",
      options: ["Buduje ściany komórkowe", "Jest składnikiem chlorofilu", "Transportuje cukry", "Odpowiada za turgor"],
      correctIndex: 1
    }
  },

  // --- ARTYKUŁ 4: ELEKTROLITY (Na, K, Cl) ---
  {
    id: 'electrolytes-04',
    title: 'Gospodarka wodno-elektrolitowa: Na, K, Cl',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Sód (Na) i Potas (K) – Antagoniści' },
      { type: 'text', value: 'Te dwa pierwiastki działają jak "bramkarze" na błonie komórkowej. ' },
      { type: 'text', value: '- Potas (K): Główny kation wewnątrzkomórkowy. Odpowiada za polaryzację błon. Jego niedobór (hipokaliemia) prowadzi do osłabienia mięśni i zaburzeń rytmu serca (bolesne skurcze).\n- Sód (Na): Główny kation płynów pozakomórkowych (np. krwi). Odpowiada za utrzymanie ciśnienia osmotycznego.' },
      { type: 'header', value: 'Sód a nadciśnienie (Mechanizm)' },
      { type: 'text', value: 'Dlaczego sól podnosi ciśnienie? Nadmiar sodu we krwi zwiększa ciśnienie osmotyczne osocza. Organizm, chcąc wyrównać stężenia, "zasysa" wodę z komórek do naczyń krwionośnych. Zwiększa to objętość krwi, co bezpośrednio podnosi ciśnienie tętnicze.' },
      { type: 'text', value: 'Niedobór sodu jest rzadki, ale groźny – prowadzi do spadku ciśnienia i zaburzeń pobudliwości nerwowej.' },
      { type: 'header', value: 'Chlor (Cl) – Trawienie' },
      { type: 'text', value: 'Chlor to główny anion organizmu. Jego kluczową funkcją w żołądku jest tworzenie kwasu solnego (HCl). Kwas ten aktywuje enzymy trawienne (pepsynogen zmienia w pepsynę) i denaturuje białka pokarmowe.' },
      { type: 'tip', value: 'W skrócie: K = serce i wnętrze komórki. Na = woda i ciśnienie krwi. Cl = trawienie w żołądku.' }
    ],
    miniQuiz: {
      question: "Który pierwiastek jest głównym kationem wewnątrzkomórkowym?",
      options: ["Sód (Na)", "Wapń (Ca)", "Potas (K)", "Magnez (Mg)"],
      correctIndex: 2
    }
  },

  // --- ARTYKUŁ 5: MIKROELEMENTY (ŚLADOWE) ---
  {
    id: 'micro-elements-05',
    title: 'Mikroelementy – mała ilość, wielkie znaczenie',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Definicja mikroelementów' },
      { type: 'text', value: 'Są to pierwiastki, których udział w suchej masie organizmu wynosi poniżej 0,01%. Mimo śladowych ilości, są niezbędne do życia.' },
      { type: 'header', value: 'Przykład: Kobalt (Co)' },
      { type: 'text', value: 'Kobalt jest centralnym atomem Witaminy B12 (kobalaminy). Witamina ta jest kluczowa w procesie erytropoezy (powstawania czerwonych krwinek). Niedobór kobaltu (i witaminy B12) prowadzi do anemii.' },
      { type: 'tip', value: 'Inne ważne mikroelementy to Żelazo (hemoglobina), Jod (hormony tarczycy) i Fluor (szkliwo).' }
    ],
    miniQuiz: {
      question: "Składnikiem której witaminy jest kobalt?",
      options: ["Witaminy C", "Witaminy D", "Witaminy B12", "Witaminy A"],
      correctIndex: 2
    }
  }
], 
    'topic_Chemia Życia_2' : [

      {
    id: 'micro-iron-01',
    title: 'Żelazo – tlen, energia i krew',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Funkcje transportowe i magazynowe' },
      { type: 'text', value: 'Żelazo (Fe) to mikroelement niezbędny do życia, mimo że organizm zużywa go w niewielkich ilościach. Jego główną funkcją jest transport tlenu.' },
      { type: 'text', value: '1. Hemoglobina (Hb): Żelazo wchodzi w skład hemu – barwnika w erytrocytach. Atom żelaza wiąże tlen w płucach w sposób odwracalny i oddaje go w tkankach. Bez żelaza synteza hemoglobiny zostaje zahamowana.' },
      { type: 'text', value: '2. Mioglobina: To białko występujące w mięśniach. Magazynuje tlen, stanowiąc rezerwę energetyczną wykorzystywaną podczas intensywnej pracy mięśni.' },
      { type: 'header', value: 'Żelazo a produkcja energii (ATP)' },
      { type: 'text', value: 'Żelazo jest składnikiem cytochromów – białek wchodzących w skład łańcucha oddechowego w mitochondriach. Umożliwiają one transport elektronów, co jest warunkiem koniecznym do produkcji ATP. Dlatego niedobór żelaza prowadzi nie tylko do niedotlenienia, ale i zaburzeń energetycznych (zmęczenie).' },
      { type: 'header', value: 'Niedobór (Anemia) i Magazynowanie' },
      { type: 'text', value: 'Niedobór prowadzi do anemii (niedokrwistości). Objawy to bladość, ciągłe zmęczenie, osłabienie oraz widoczne zmiany: łamliwość paznokci i wypadanie włosów. Organizm magazynuje nadmiar żelaza w wątrobie w postaci białka – ferrytyny.' },
      { type: 'header', value: 'Żelazo u roślin' },
      { type: 'text', value: 'U roślin żelazo jest niezbędne do syntezy chlorofilu (mimo że nie wchodzi w jego skład, jest kofaktorem enzymów go tworzących) oraz bierze udział w fazie jasnej fotosyntezy (transport elektronów).' },
      { type: 'tip', value: 'Pamiętaj: Żelazo i Jod to dwa mikroelementy, których niedobory są uznawane za globalne problemy zdrowotne.' }
    ],
    miniQuiz: {
      question: "Jak nazywa się białko magazynujące tlen w mięśniach, zawierające żelazo?",
      options: ["Hemoglobina", "Ferrytyna", "Mioglobina", "Cytochrom"],
      correctIndex: 2
    }
  },

  // --- ARTYKUŁ 2: JOD (I) ---
  {
    id: 'micro-iodine-02',
    title: 'Jod – napęd metabolizmu i rozwój mózgu',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Hormony tarczycy' },
      { type: 'text', value: 'Jod jest absolutnie niezbędny do syntezy dwóch hormonów tarczycy: tyroksyny (T4) i trójjodotyroniny (T3). Hormony te regulują tempo metabolizmu całego organizmu oraz temperaturę ciała.' },
      { type: 'header', value: 'Skutki niedoboru: Wole tarczycowe' },
      { type: 'text', value: 'Gdy w diecie brakuje jodu, tarczyca nie może produkować wystarczającej ilości hormonów. Przysadka mózgowa stymuluje wtedy tarczycę do intensywniejszej pracy, co powoduje jej patologiczny rozrost – powstaje tzw. wole tarczycowe (widoczne powiększenie szyi).'},
      { type: 'header', value: 'Znaczenie dla rozwoju (Kretynizm)' },
      { type: 'text', value: 'Jod jest kluczowy dla rozwoju układu nerwowego u płodu i dzieci. Niedobór jodu u kobiet w ciąży może prowadzić do nieodwracalnego upośledzenia umysłowego i zahamowania wzrostu u dziecka (dawniej nazywane kretynizmem).' },
      { type: 'header', value: 'Źródła i profilaktyka' },
      { type: 'text', value: 'Naturalnym bogactwem jodu są ryby morskie i owoce morza (dzięki zawartości jodu w wodzie morskiej). Aby zapobiegać niedoborom w populacji, w wielu krajach (w tym w Polsce) stosuje się obowiązkowe jodowanie soli kuchennej.' },
      { type: 'tip', value: 'Kluczowe skojarzenie: Jod = Tarczyca = Metabolizm + Rozwój Mózgu.' }
    ],
    miniQuiz: {
      question: "Co jest bezpośrednim skutkiem próby kompensacji braku jodu przez tarczycę?",
      options: ["Nadprodukcja tyroksyny", "Wole tarczycowe (powiększenie gruczołu)", "Zmniejszenie masy ciała", "Zanik tarczycy"],
      correctIndex: 1
    }
  },

  // --- ARTYKUŁ 3: FLUOR (F) ---
  {
    id: 'micro-fluorine-03',
    title: 'Fluor – tarcza dla zębów i kości',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Wzmocnienie szkliwa' },
      { type: 'text', value: 'Fluor jest niezbędny do utrzymania twardości kości i zębów. Wbudowuje się w szkliwo, przekształcając hydroksyapatyt w fluoroapatyt. Związek ten jest znacznie twardszy i bardziej odporny na działanie kwasów wytwarzanych przez bakterie próchnicze.' },
      { type: 'header', value: 'Niedobór i nadmiar (Fluoroza)' },
      { type: 'text', value: 'Niedobór fluoru skutkuje zwiększoną podatnością na próchnicę zębów (ubytki). Jednak fluor jest pierwiastkiem, który łatwo przedawkować. Jego nadmiar jest toksyczny i prowadzi do fluorozy. Objawia się ona kredowymi lub brązowymi plamami na zębach oraz kruchością kości. ' },
      { type: 'header', value: 'Źródła i suplementacja' },
      { type: 'text', value: 'Podobnie jak jod, fluor występuje obficie w rybach morskich oraz w herbacie. W ramach profilaktyki stosuje się pasty do zębów z fluorem, zabiegi lakierowania zębów, a w niektórych regionach – fluorkowanie wody pitnej.' },
      { type: 'tip', value: 'Balans jest kluczem: Fluor jest niezbędny, by uniknąć próchnicy, ale jego nadmiar niszczy zęby (fluoroza).' }
    ],
    miniQuiz: {
      question: "Jak nazywa się choroba wywołana toksycznym nadmiarem fluoru?",
      options: ["Próchnica", "Fluoroza", "Osteoporoza", "Anemia"],
      correctIndex: 1
    }
  },
      // --- ARTYKUŁ 1: CYNK (Zn) i MIEDŹ (Cu) ---
  {
    id: 'micro-zinc-copper-04',
    title: 'Cynk i Miedź – enzymy, odporność i krew',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Cynk (Zn) – Mistrz regeneracji i regulacji' },
      { type: 'text', value: 'Cynk jest kofaktorem dla setek enzymów (m.in. polimeraz DNA i RNA), co czyni go niezbędnym w procesach podziału komórek i syntezy białek. Bez cynku organizm nie może rosnąć ani się regenerować.' },
      { type: 'text', value: 'Kluczowe funkcje biologiczne cynku:\n1. Magazynowanie insuliny: W komórkach β trzustki insulina jest magazynowana w formie krystalicznej, stabilizowanej właśnie przez jony cynku.\n2. Gojenie ran: Przyspiesza regenerację skóry i błon śluzowych.\n3. Układ odpornościowy: Jest niezbędny do prawidłowego funkcjonowania limfocytów T.' },
      { type: 'text', value: 'Objawy niedoboru: Trudno gojące się rany, wypadanie włosów, białe plamki na paznokciach, zaburzenia wzrostu (karłowatość) oraz osłabienie odporności.' },
      
      { type: 'header', value: 'Miedź (Cu) – Pomocnik żelaza' },
      { type: 'text', value: 'Choć to żelazo buduje hemoglobinę, miedź jest niezbędna do jej syntezy. Bierze udział w transporcie żelaza do szpiku kostnego oraz wchłanianiu go z przewodu pokarmowego. Dlatego niedobór miedzi również prowadzi do anemii (niedokrwistości), opornej na leczenie samym żelazem.' },
      { type: 'text', value: 'Inne funkcje miedzi:\n- Jest składnikiem enzymów łańcucha oddechowego (oksydaza cytochromowa) w mitochondriach.\n- Uczestniczy w syntezie kolagenu i elastyny (wytrzymałość naczyń krwionośnych).\n- U wielu bezkręgowców (np. mięczaki, skorupiaki) jest składnikiem hemocyjaniny – niebieskiego barwnika krwi transportującego tlen (analogicznie do hemoglobiny u kręgowców).' },
      
      { type: 'tip', value: 'Skojarzenie maturalne: Cynk = skóra, rany i insulina. Miedź = synteza hemoglobiny i łańcuch oddechowy.' }
    ],
    miniQuiz: {
      question: "Jaki barwnik oddechowy, występujący u bezkręgowców, zawiera miedź zamiast żelaza?",
      options: ["Hemoglobina", "Mioglobina", "Hemocyjanina", "Chlorofil"],
      correctIndex: 2
    }
  },

  // --- ARTYKUŁ 2: MANGAN (Mn) i MOLIBDEN (Mo) ---
  {
    id: 'micro-manganese-molybdenum-05',
    title: 'Mangan i Molibden – kluczowe dla roślin',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Mangan (Mn) – Fotosynteza i enzymy' },
      { type: 'text', value: 'Mangan jest pierwiastkiem szczególnie istotnym w fizjologii roślin. Wchodzi w skład tzw. kompleksu rozkładającego wodę w fotosystemie II (PSII). To właśnie dzięki manganowi zachodzi fotoliza wody podczas fazy jasnej fotosyntezy, co skutkuje uwolnieniem tlenu do atmosfery.' },
      { type: 'text', value: 'U zwierząt i ludzi mangan aktywuje enzymy cyklu Krebsa oraz enzymy odpowiedzialne za syntezę hormonów płciowych i funkcjonowanie układu nerwowego.' },
      
      { type: 'header', value: 'Molibden (Mo) – Metabolizm azotu' },
      { type: 'text', value: 'Molibden to pierwiastek ściśle związany z przyswajaniem azotu. Jest niezbędnym kofaktorem enzymu reduktazy azotanowej, który u roślin przekształca pobrane z gleby azotany (NO₃⁻) w formy przyswajalne (amoniak), niezbędne do budowy aminokwasów.' },
      { type: 'text', value: 'Jest również kluczowy dla bakterii brodawkowych (Rhizobium) żyjących w symbiozie z roślinami motylkowatymi. Wchodzi w skład nitrogenazy – enzymu umożliwiającego wiązanie wolnego azotu atmosferycznego (N₂).' },
      
      { type: 'tip', value: 'Zapamiętaj: Bez manganu nie ma tlenu z fotosyntezy (brak fotolizy). Bez molibdenu rośliny mają problem z przyswajaniem azotu (nawet przy dobrym nawożeniu).' }
    ],
    miniQuiz: {
      question: "W jakim procesie fotosyntezy bezpośrednio uczestniczy mangan?",
      options: ["W cyklu Calvina (faza ciemna)", "W fotolizie wody (faza jasna)", "W transporcie cukrów w łyku", "W otwieraniu aparatów szparkowych"],
      correctIndex: 1
    }
  },

  // --- ARTYKUŁ 3: SELEN (Se), CHROM (Cr), KOBALT (Co) ---
  {
    id: 'micro-selenium-chromium-cobalt-06',
    title: 'Selen, Chrom i Kobalt – antyoksydacja i metabolizm',
    videoUrl: '',
    content: [
      { type: 'header', value: 'Selen (Se) – Ochrona i Tarczyca' },
      { type: 'text', value: 'Selen działa synergistycznie z witaminą E, pełniąc funkcję potężnego przeciwutleniacza. Jest składnikiem peroksydazy glutationowej – enzymu chroniącego komórki przed stresem oksydacyjnym (niszczeniem przez wolne rodniki) poprzez rozkład nadtlenku wodoru.' },
      { type: 'text', value: 'Rola w tarczycy: Selen jest niezbędny do konwersji (przekształcania) mniej aktywnego hormonu T4 w silnie działający hormon T3. Dlatego problemy z tarczycą mogą wynikać nie tylko z braku jodu, ale też selenu.' },
      
      { type: 'header', value: 'Chrom (Cr) – Kontrola glukozy' },
      { type: 'text', value: 'Chrom wchodzi w skład tzw. czynnika tolerancji glukozy (GTF). Jego głównym zadaniem jest uwrażliwianie komórek na działanie insuliny. Ułatwia wiązanie insuliny z jej receptorem na powierzchni błony komórkowej, co umożliwia transport glukozy z krwi do wnętrza komórki.' },
      { type: 'text', value: 'Niedobór chromu może prowadzić do stanów podobnych do cukrzycy (hiperglikemii) oraz wzmożonego apetytu na słodycze.' },

      { type: 'header', value: 'Kobalt (Co) – Witamina B12' },
      { type: 'text', value: 'Kobalt w organizmie człowieka nie występuje w stanie wolnym, lecz jako centralny atom w cząsteczce witaminy B12 (kobalaminy). Ponieważ witamina B12 odpowiada za wytwarzanie erytrocytów, rola kobaltu jest bezpośrednio związana z zapobieganiem anemii złośliwej.' },
      { type: 'text', value: 'Co ciekawe, rośliny nie potrzebują kobaltu do życia, ale jest on niezbędny dla bakterii wiążących azot, które z nimi współpracują.' },
      
      { type: 'tip', value: 'Kluczowe hasła: Selen = antyoksydant. Chrom = insulina i cukier. Kobalt = B12 i anemia.' }
    ],
    miniQuiz: {
      question: "Z jakim hormonem ściśle współpracuje chrom w regulacji metabolizmu węglowodanów?",
      options: ["Z adrenaliną", "Z insuliną", "Z testosteronem", "Z kortyzolem"],
      correctIndex: 1
    }
  }
    ],

};
