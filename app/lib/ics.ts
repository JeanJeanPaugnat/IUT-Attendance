// Lecture des fichiers ICS de l'emploi du temps (export ADE de l'IUT).
// Fonctions pures, sans accès réseau ni fichier : faciles à tester.

import type { Annee, Cours, TypeCours } from './definitions';

type EvenementBrut = Record<string, string>;

/** Découpe le texte ICS en VEVENT bruts : { UID: '…', DTSTART: '…', SUMMARY: '…' }. */
function lireEvenements(ics: string): EvenementBrut[] {
  const lignes = ics
    .replace(/\r\n/g, '\n') // fins de ligne Windows
    .replace(/\n[ \t]/g, '') // RFC 5545 : une ligne qui commence par un espace continue la précédente
    .split('\n');

  const evenements: EvenementBrut[] = [];
  let courant: EvenementBrut | null = null;

  for (const ligne of lignes) {
    if (ligne === 'BEGIN:VEVENT') {
      courant = {};
    } else if (ligne === 'END:VEVENT') {
      if (courant) evenements.push(courant);
      courant = null;
    } else if (courant) {
      const separateur = ligne.indexOf(':'); // le premier « : » seulement
      if (separateur === -1) continue;
      // « DTSTART;VALUE=DATE » -> clé « DTSTART »
      const cle = ligne.slice(0, separateur).split(';')[0];
      courant[cle] = ligne.slice(separateur + 1);
    }
  }
  return evenements;
}

/** « R5.02 TD X\, BUT3-G3 » -> « R5.02 TD X, BUT3-G3 » */
function desechapper(texte: string): string {
  return texte
    .replace(/\\n/gi, '\n')
    .replace(/\\([,;\\])/g, '$1')
    .trim();
}

/** « 20260901T083000Z » (UTC) ou « 20270308 » (journée entière) -> Date. */
function lireDate(valeur: string): Date {
  const m = valeur.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!m) throw new Error(`Date ICS invalide : ${valeur}`);
  const [, a, mo, j, h = '0', mi = '0', s = '0'] = m;
  return new Date(Date.UTC(+a, +mo - 1, +j, +h, +mi, +s));
}

const REGEX_TAGS = /\[(ANNUL[EÉ]|EVAL)\]\s*/gi;
const REGEX_TYPE = /\b(CM|TD|TP|Autonomie|Eval-TD|Eval-CM)\b/;
// « SAÉ 5.Crea.01 », « R5.DWeb-DI.06 », « PORTFOLIO S3 », « PORTFOLIO.Crea.S6 »
const REGEX_CODE = /^(SA[EÉ] \S+|PORTFOLIO(?:\.\S+| S\d)?|R\d\.\S+)/i;
// Valeurs d'ADE qui ne sont pas un vrai enseignant
const PAS_UN_ENSEIGNANT = /NON AFFECTE|A TROUVER|SI Besoin/i;

/** « BUT3-G1.BUT3-G2 » -> ['G1', 'G2'] ; « BUT1.G21 » (sous-groupe) -> ['G2']. */
function lireGroupes(texte: string): string[] {
  const groupes = new Set<string>();
  for (const m of texte.matchAll(/G(\d)/g)) groupes.add(`G${m[1]}`);
  return [...groupes].sort();
}

function lireType(brut: string | undefined): TypeCours {
  if (!brut) return 'Autre';
  if (brut.startsWith('Eval-')) return brut.slice(5) as TypeCours; // « Eval-TD » -> « TD »
  return brut as TypeCours;
}

/**
 * Découpe le résumé d'un cours de l'IUT.
 *   « [ANNULE] SAÉ 5.DWeb-DI.01 TP SPRINGINSFELD Denis, BUT3-G3 »
 *      └─tag─┘ └─────code──────┘ └┬┘ └───enseignant───┘  └groupes┘
 */
export function lireResume(resume: string) {
  const tags = [...resume.matchAll(REGEX_TAGS)].map((m) => m[1].toUpperCase());
  const propre = resume.replace(REGEX_TAGS, '').trim();

  // Les groupes sont après la dernière virgule.
  const virgule = propre.lastIndexOf(',');
  const principal =
    virgule === -1
      ? propre.replace(/\s*BUT\d\S*(?:\s+G\d+)*/g, '').trim() // « R5.04 TD BUT3-G3 » (sans virgule)
      : propre.slice(0, virgule).trim();
  const partieGroupes = virgule === -1 ? propre : propre.slice(virgule + 1);

  const code = principal.match(REGEX_CODE)?.[1] ?? principal;
  const apresCode = principal.slice(code.length).trim();
  const typeTrouve = apresCode.match(REGEX_TYPE);
  const type = lireType(typeTrouve?.[1]);

  let enseignant = typeTrouve
    ? apresCode.slice(typeTrouve.index! + typeTrouve[0].length).trim()
    : apresCode;
  if (type === 'Autonomie' || PAS_UN_ENSEIGNANT.test(enseignant)) enseignant = '';

  return {
    code: code || propre,
    type,
    enseignant: enseignant || null,
    groupes: /BUT\d/.test(partieGroupes) ? lireGroupes(partieGroupes) : [],
    annule: tags.some((t) => t.startsWith('ANNUL')),
    evaluation: tags.includes('EVAL') || /Eval-/.test(propre),
  };
}

/** Transforme le contenu d'un fichier ICS d'une promo en liste de cours, triés par début. */
export function lireCalendrier(ics: string, annee: Annee): Cours[] {
  return lireEvenements(ics)
    .filter((e) => e.UID && e.DTSTART && e.DTEND && e.SUMMARY)
    .map((e) => {
      const resume = desechapper(e.SUMMARY);
      return {
        uid: e.UID,
        annee,
        ...lireResume(resume),
        salle: desechapper(e.LOCATION ?? '') || null,
        debut: lireDate(e.DTSTART),
        fin: lireDate(e.DTEND),
        resume,
      };
    })
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());
}
