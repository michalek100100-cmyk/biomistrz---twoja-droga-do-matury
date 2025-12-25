
import { Question } from '../types';

/**
 * SZABLON DODAWANIA WŁASNYCH PYTAŃ:
 * Możesz przesłać mi listę pytań w TXT, a ja wygeneruję taki blok kodu:
 */

// --- TWOJE WŁASNE PYTANIA (PRZYKŁAD) ---
export const USER_CUSTOM_QUESTIONS: Question[] = [
  {
    id: 'user_1',
    type: 'multiple_choice',
    question: 'Wstaw tutaj swoje własne pytanie z pliku TXT lub PDF.',
    options: ['Opcja 1', 'Opcja 2', 'Opcja 3', 'Opcja 4'],
    correctAnswer: 'Opcja 1',
    explanation: 'Tutaj pojawi się Twoje wyjaśnienie.',
    category: 'Moje Zadania'
  }
];

// --- OFICJALNA BAZA: KOMÓRKI ---

// Temat 1: Organizacja i Mikroskopia (Rozszerzone)
export const CELL_TOPIC_1_QUESTIONS: Question[] = [
  {
    id: 'k1_1',
    type: 'multiple_choice',
    question: 'Który element budowy jest charakterystyczny WYŁĄCZNIE dla komórki prokariotycznej?',
    options: ['Rybosomy', 'Błona komórkowa', 'Nukleoid', 'Cytoszkielet'],
    correctAnswer: 'Nukleoid',
    explanation: 'Komórki prokariotyczne nie mają jądra, ich DNA znajduje się w obszarze zwanym nukleoidem. Eukarioty mają jądro komórkowe.',
    category: 'Prokarioty vs Eukarioty'
  },
  {
    id: 'k1_2',
    type: 'multiple_choice',
    question: 'Podczas obserwacji mikroskopowej komórki stwierdzono obecność ściany komórkowej i licznych mitochondriów, ale brak chloroplastów. Jest to prawdopodobnie komórka:',
    options: ['Zwierzęca', 'Bakterii', 'Grzyba', 'Roślinna (miękisz asymilacyjny)'],
    correctAnswer: 'Grzyba',
    explanation: 'Komórki grzybów mają ścianę (chitynową) i mitochondria, ale nigdy nie mają chloroplastów.',
    category: 'Rozpoznawanie komórek'
  },
  {
    id: 'k1_3',
    type: 'multiple_choice',
    question: 'Zdolność rozdzielcza mikroskopu świetlnego wynosi około 0,2 µm. Oznacza to, że:',
    options: ['Możemy w nim zobaczyć strukturę rybosomów', 'Dwa punkty oddalone o 0,1 µm będą widoczne jako jeden', 'Powiększenie zawsze wynosi 2000x', 'Nie można nim obserwować żywych komórek'],
    correctAnswer: 'Dwa punkty oddalone o 0,1 µm będą widoczne jako jeden',
    explanation: 'Zdolność rozdzielcza to najmniejsza odległość między punktami, przy której są one widoczne jako oddzielne obiekty.',
    category: 'Mikroskopia'
  }
];

// Temat 2: Błony i Ściana (Rozszerzone)
export const CELL_TOPIC_2_QUESTIONS: Question[] = [
  {
    id: 'k2_1',
    type: 'multiple_choice',
    question: 'Model "płynnej mozaiki" opisuje błonę jako strukturę, w której:',
    options: ['Białka są sztywno osadzone w lipidach', 'Lipidy i białka mogą poruszać się w płaszczyźnie błony', 'Błona składa się wyłącznie z cukrów', 'Tylko woda może swobodnie przepływać'],
    correctAnswer: 'Lipidy i białka mogą poruszać się w płaszczyźnie błony',
    explanation: 'Płynność błony zależy od ruchu cząsteczek fosfolipidów i białek integralnych.',
    category: 'Budowa błony'
  },
  {
    id: 'k2_2',
    type: 'multiple_choice',
    question: 'Głównym składnikiem ściany komórkowej u roślin jest celuloza. Z chemicznego punktu widzenia jest to:',
    options: ['Białko strukturalne', 'Polisacharyd zbudowany z glukozy', 'Trójgliceryd', 'Aminokwas'],
    correctAnswer: 'Polisacharyd zbudowany z glukozy',
    explanation: 'Celuloza to liniowy polimer glukozy połączonej wiązaniami beta-1,4-glikozydowymi.',
    category: 'Ściana komórkowa'
  }
];

// Temat 3: Transport i Osmoza (Rozszerzone)
export const CELL_TOPIC_3_QUESTIONS: Question[] = [
  {
    id: 'k3_1',
    type: 'multiple_choice',
    question: 'W jakim roztworze komórka zwierzęca (np. erytrocyt) ulegnie lizie (pęknięciu)?',
    options: ['Izotonicznym', 'Hipertonicznym', 'Hipotonicznym', 'Nasyconym solą'],
    correctAnswer: 'Hipotonicznym',
    explanation: 'W roztworze hipotonicznym woda wnika do komórki. Brak ściany komórkowej u zwierząt powoduje pękanie błony.',
    category: 'Osmoza'
  },
  {
    id: 'k3_2',
    type: 'multiple_choice',
    question: 'Transport aktywny pierwotny różni się od dyfuzji tym, że:',
    options: ['Zachodzi zgodnie z gradientem stężeń', 'Wymaga bezpośredniego zużycia energii z ATP', 'Nie wymaga udziału białek', 'Dotyczy tylko cząsteczek wody'],
    correctAnswer: 'Wymaga bezpośredniego zużycia energii z ATP',
    explanation: 'Transport aktywny przenosi substancje przeciwko gradientowi, co wymaga nakładu energii (ATP).',
    category: 'Transport'
  },
  {
    id: 'k3_3',
    type: 'true_false',
    question: 'Plazmoliza zachodzi, gdy komórka roślinna traci wodę w roztworze hipertonicznym.',
    correctAnswer: 'Prawda',
    explanation: 'Odpływ wody z wakuoli powoduje kurczenie się protoplastu i jego odstawanie od ściany komórkowej.',
    category: 'Osmoza'
  }
];

// Temat 4: Jądro i Rybosomy
export const CELL_TOPIC_4_QUESTIONS: Question[] = [
  {
    id: 'k4_1',
    type: 'multiple_choice',
    question: 'W jądrze komórkowym DNA występuje w połączeniu z białkami zasadowymi, tworząc chromatynę. Te białka to:',
    options: ['Enzymy', 'Histony', 'Przeciwciała', 'Hormony'],
    correctAnswer: 'Histony',
    explanation: 'Histony to białka, wokół których nawinięte jest DNA, co pozwala na jego upakowanie w jądrze.',
    category: 'Jądro'
  },
  {
    id: 'k4_2',
    type: 'multiple_choice',
    question: 'Rybosomy eukariotyczne (80S) występują:',
    options: ['Wyłącznie w jądrze', 'Wolno w cytozolu lub przyczepione do RER', 'Tylko wewnątrz mitochondriów', 'Wewnątrz aparatu Golgiego'],
    correctAnswer: 'Wolno w cytozolu lub przyczepione do RER',
    explanation: 'Rybosomy mogą być wolne (produkują białka na potrzeby komórki) lub związane z siateczką (białka na eksport).',
    category: 'Rybosomy'
  }
];

// Temat 5: Energetyka (Mitochondria i Chloroplasty)
export const CELL_TOPIC_5_QUESTIONS: Question[] = [
  {
    id: 'k5_1',
    type: 'multiple_choice',
    question: 'Wewnętrzna błona mitochondrium jest silnie pofałdowana w grzebienie. Jaki jest cel tej adaptacji?',
    options: ['Zwiększenie powierzchni syntezy białek', 'Zwiększenie powierzchni dla łańcucha oddechowego i syntezy ATP', 'Magazynowanie glikogenu', 'Ochrona DNA'],
    correctAnswer: 'Zwiększenie powierzchni dla łańcucha oddechowego i syntezy ATP',
    explanation: 'Większa powierzchnia błony wewnętrznej pozwala na rozmieszczenie większej liczby kompleksów enzymatycznych produkujących energię.',
    category: 'Mitochondria'
  },
  {
    id: 'k5_2',
    type: 'multiple_choice',
    question: 'Stroma to przestrzeń wewnątrz:',
    options: ['Mitochondrium', 'Chloroplastu', 'Jądra', 'Wakuoli'],
    correctAnswer: 'Chloroplastu',
    explanation: 'Stroma to koloidalna substancja wewnątrz chloroplastu, w której zachodzi faza ciemna fotosyntezy.',
    category: 'Chloroplasty'
  }
];

// Temat 6: Homeostaza i Ruch (Wakuola i Cytoszkielet)
export const CELL_TOPIC_6_QUESTIONS: Question[] = [
  {
    id: 'k6_1',
    type: 'multiple_choice',
    question: 'Element cytoszkieletu zbudowany z tubuliny, odpowiedzialny za transport wewnątrzkomórkowy i ruch rzęsek, to:',
    options: ['Mikrofilamenty aktynowe', 'Filamenty pośrednie', 'Mikrotubule', 'Włókna celulozowe'],
    correctAnswer: 'Mikrotubule',
    explanation: 'Mikrotubule to sztywne rurki z tubuliny, pełniące rolę "szyn" dla transportu pęcherzyków.',
    category: 'Cytoszkielet'
  }
];

export const CHEMISM_LIFE_QUESTIONS: Question[] = [
  {
    id: 'cz_1',
    type: 'multiple_choice',
    question: 'Która właściwość wody pozwala niektórym owadom, np. nartnikom, poruszać się po jej powierzchni?',
    options: ['Wysokie ciepło właściwe', 'Napięcie powierzchniowe', 'Gęstość zależna od temperatury', 'Duże ciepło parowania'],
    correctAnswer: 'Napięcie powierzchniowe',
    explanation: 'Dzięki silnym siłom spójności (kohezji) między cząsteczkami wody na jej styku z powietrzem tworzy się sprężysta błona, która utrzymuje lekkie obiekty.',
    category: 'Właściwości fizyczne wody'
  },
  {
    id: 'cz_2',
    type: 'multiple_choice',
    question: 'Dlaczego woda jest nazywana "uniwersalnym rozpuszczalnikiem"?',
    options: ['Ponieważ ma dipolową budowę cząsteczki', 'Ponieważ jest bezbarwna i bezwonna', 'Ponieważ ma mniejszą gęstość w stanie stałym niż ciekłym', 'Ponieważ występuje w trzech stanach skupienia'],
    correctAnswer: 'Ponieważ ma dipolową budowę cząsteczki',
    explanation: 'Dipolowa budowa wody (rozdzielenie ładunków dodatnich i ujemnych) pozwala jej otaczać i rozbijać cząsteczki innych substancji polarnych i jonowych.',
    category: 'Właściwości chemiczne wody'
  },
  {
    id: 'cz_3',
    type: 'multiple_choice',
    question: 'Woda osiąga największą gęstość w temperaturze:',
    options: ['0°C', '-4°C', '4°C', '100°C'],
    correctAnswer: '4°C',
    explanation: 'Przy 4°C woda jest najcięższa, co sprawia, że opada na dno zbiorników wodnych, umożliwiając organizmom wodnym przetrwanie zimy pod warstwą lodu.',
    category: 'Właściwości fizyczne wody'
  },
  {
    id: 'cz_4',
    type: 'multiple_choice',
    question: 'Która właściwość wody umożliwia skuteczne chłodzenie organizmu podczas pocenia się?',
    options: ['Wysokie ciepło parowania', 'Mała lepkość', 'Wysokie ciepło właściwe', 'Duża gęstość'],
    correctAnswer: 'Wysokie ciepło parowania',
    explanation: 'Aby woda odparowała z powierzchni skóry, musi pobrać dużą ilość energii (ciepła) z organizmu, co obniża jego temperaturę.',
    category: 'Termoregulacja'
  },
  {
    id: 'cz_5',
    type: 'multiple_choice',
    question: 'Siły adhezji wody to zdolność do:',
    options: ['Wzajemnego przyciągania się cząsteczek wody', 'Przywierania cząsteczek wody do powierzchni innych ciał', 'Szybkiego nagrzewania się pod wpływem słońca', 'Zmiany stanu skupienia w lód'],
    correctAnswer: 'Przywierania cząsteczek wody do powierzchni innych ciał',
    explanation: 'Adhezja to siły oddziaływania między cząsteczkami wody a powierzchniami (np. ściankami naczyń włosowatych w roślinach), co wspomaga transport wody w górę.',
    category: 'Właściwości fizyczne wody'
  },
  {
    id: 'cz_6',
    type: 'multiple_choice',
    question: 'Dlaczego lód pływa po powierzchni wody?',
    options: ['Bo ma mniejszą gęstość niż woda ciekła', 'Bo jest cieplejszy od wody pod spodem', 'Bo zawiera pęcherzyki tlenu', 'Bo cząsteczki lodu szybciej się poruszają'],
    correctAnswer: 'Bo ma mniejszą gęstość niż woda ciekła',
    explanation: 'Podczas zamarzania woda tworzy strukturę krystaliczną, w której cząsteczki są od siebie bardziej oddalone niż w cieczy, co zmniejsza gęstość lodu.',
    category: 'Właściwości fizyczne wody'
  },
  {
    id: 'cz_7',
    type: 'multiple_choice',
    question: 'Która właściwość wody chroni organizmy przed gwałtownymi zmianami temperatury otoczenia?',
    options: ['Wysokie ciepło właściwe', 'Przezroczystość', 'Napięcie powierzchniowe', 'Duże ciepło topnienia'],
    correctAnswer: 'Wysokie ciepło właściwe',
    explanation: 'Woda musi przyjąć lub oddać dużo energii, aby jej temperatura zmieniła się o 1 stopień, co stabilizuje temperaturę ciała organizmów wodnych i lądowych.',
    category: 'Termoregulacja'
  },
  {
    id: 'cz_8',
    type: 'multiple_choice',
    question: 'Siły kohezji wody to:',
    options: ['Przyciąganie cząsteczek wody przez cząsteczki powietrza', 'Wzajemne przyciąganie się cząsteczek wody (wiązania wodorowe)', 'Rozpuszczanie substancji tłuszczowych', 'Odrzucanie cząsteczek tlenu'],
    correctAnswer: 'Wzajemne przyciąganie się cząsteczek wody (wiązania wodorowe)',
    explanation: 'Kohezja to spójność wynikająca z tworzenia się wiązań wodorowych między cząsteczkami wody, co pozwala m.in. na transport słupa wody w naczyniach roślin.',
    category: 'Właściwości chemiczne wody'
  },
  {
    id: 'cz_9',
    type: 'multiple_choice',
    question: 'Woda stanowi średnio około ilu procent masy ciała dorosłego człowieka?',
    options: ['20-30%', '40-50%', '60-70%', '90-95%'],
    correctAnswer: '60-70%',
    explanation: 'Woda jest głównym składnikiem organizmu, wypełniając komórki, naczynia krwionośne i przestrzenie międzykomórkowe.',
    category: 'Znaczenie wody w organizmie'
  }
];
