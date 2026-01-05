
import React from 'react';
import { Feature, NavLink } from './types';

export const NAV_LINKS: NavLink[] = [
  { label: 'O aplikacji', href: '#o-aplikacji' },
  { label: 'Moja misja', href: '#moja-misja' },
  { label: 'Funkcje', href: '#funkcje' },
  { label: 'Kontakt', href: '#kontakt' },
];

export const FEATURES: Feature[] = [
  {
    title: 'Zgodność z CKE',
    description: 'Wszystkie materiały są starannie przygotowane w oparciu o aktualne wymagania egzaminacyjne.',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Fiszki i Quizy',
    description: 'Interaktywne metody nauki, które pomogą Ci zapamiętać nawet najtrudniejsze pojęcia z cytologii czy genetyki.',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    title: 'Śledzenie postępów',
    description: 'Statystyki, które pokazują Ci, ile już umiesz, a nad czym musisz jeszcze popracować.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2',
  },
];
