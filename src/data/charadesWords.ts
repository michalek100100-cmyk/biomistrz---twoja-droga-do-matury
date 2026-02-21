// src/data/charadesWords.ts

export const BIOLOGICAL_WORDS = [
    "Mitochondrium",
    "Chloroplast",
    "Mitoza",
    "Mejoza",
    "DNA",
    "RNA",
    "Serce",
    "Płuco",
    "Fotosynteza",
    "Bakteria",
    "Wirus",
    "Komórka",
    "Gen",
    "Chromosom",
    "Rybosom",
    "Jądro komórkowe",
    "Aparatu Golgiego",
    "Enzym",
    "Białko",
    "Lipidy",
    "Glukoza",
    "Oddychanie komórkowe",
    "Ekosystem",
    "Ewolucja",
    "Dobór naturalny",
    "Tkanka",
    "Narząd",
    "Układ krwionośny",
    "Układ nerwowy",
    "Neuron",
    "Synapsa",
    "Atp",
    "Chlorofil",
    "Vakuola",
    "Lizosom"
];

export const getRandomWord = () => {
    return BIOLOGICAL_WORDS[Math.floor(Math.random() * BIOLOGICAL_WORDS.length)];
};
