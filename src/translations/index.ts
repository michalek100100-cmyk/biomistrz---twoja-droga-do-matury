// src/translations/index.ts
import { pl } from './pl';
import { en } from './en';
import { es } from './es';
import { ch } from './ch';
import { cz } from './cz';
import { de } from './de';
import { jp } from './jp';
import { Language, TranslationSchema } from './types';

export * from './types';

export const translations: Record<Language, TranslationSchema> = {
    pl,
    en,
    es,
    ch,
    cz,
    de,
    jp,
};
