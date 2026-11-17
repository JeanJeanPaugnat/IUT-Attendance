// Accès à l'emploi du temps : charge les ICS des 3 promos et répond aux
// questions de l'app (cours du jour, cours d'un enseignant, cours actuel).
// À n'utiliser que côté serveur (Server Components, Server Actions, routes).
//
// Performance : les ICS (~1 Mo, ~2800 cours) sont téléchargés, parsés et
// indexés UNE fois, puis gardés en mémoire 1 h. Chaque recherche est ensuite
// une simple lecture de Map (quelques microsecondes) au lieu d'un parcours
// des 2800 cours.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { lireCalendrier } from './ics';
import type { Annee, Cours } from './definitions';

export const ANNEES: Annee[] = [1, 2, 3];

/** Les ICS sont en UTC ; les jours et heures se comparent en heure de Paris. */
export const FUSEAU = 'Europe/Paris';

/** Durée de vie de l'emploi du temps en mémoire avant rechargement. */
const DUREE_CACHE_MS = 60 * 60 * 1000;

/** On peut ouvrir l'appel un peu avant le début du cours. */
const OUVERTURE_AVANT_MS = 15 * 60 * 1000;

// Un seul formateur réutilisé : en créer un par appel (toLocaleDateString)
// coûtait ~130 ms pour parcourir les 2800 cours.
const formateurJour = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU });

/** « AAAA-MM-JJ » d'une date, en heure de Paris (ex. pour comparer deux jours ou dans une URL). */
export function cleJour(date: Date): string {
  return formateurJour.format(date);
}

// ------------------------------------------------------------------
// Chargement
// ------------------------------------------------------------------

/**
 * Récupère le texte ICS d'une promo :
 *  1. depuis l'URL `ICS_URL_MMI{annee}` si elle est définie ;
 *  2. sinon depuis le fichier `data/calendars/mmi{annee}.ics`.
 */
async function chargerIcs(annee: Annee): Promise<string> {
  const url = process.env[`ICS_URL_MMI${annee}`];
  if (url) {
    // `revalidate` : sur Vercel, évite de retélécharger à chaque démarrage à froid.
    const reponse = await fetch(url, { next: { revalidate: 3600 } });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    return reponse.text();
  }
  return readFile(path.join(process.cwd(), 'data', 'calendars', `mmi${annee}.ics`), 'utf8');
}

type EmploiDuTemps = {
  /** Tous les cours, triés par heure de début. */
  cours: Cours[];
  /** « 2026-11-17 » -> cours de ce jour (triés). */
  parJour: Map<string, Cours[]>;
  /** UID ICS -> cours. */
  parUid: Map<string, Cours>;
};

function indexer(cours: Cours[]): EmploiDuTemps {
  const parJour = new Map<string, Cours[]>();
  const parUid = new Map<string, Cours>();
  for (const c of cours) {
    const cle = cleJour(c.debut);
    const liste = parJour.get(cle);
    if (liste) liste.push(c);
    else parJour.set(cle, [c]);
    parUid.set(c.uid, c);
  }
  return { cours, parJour, parUid };
}

/** Dernier emploi du temps valide de chaque promo (conservé si un rechargement échoue). */
const dernierParAnnee = new Map<Annee, Cours[]>();
let cache: { emploi: EmploiDuTemps; expire: number } | null = null;
let enCours: Promise<EmploiDuTemps> | null = null;

async function construire(): Promise<EmploiDuTemps> {
  const parAnnee = await Promise.all(
    ANNEES.map(async (annee) => {
      try {
        const cours = lireCalendrier(await chargerIcs(annee), annee);
        dernierParAnnee.set(annee, cours);
        return cours;
      } catch (erreur) {
        // ADE / GitHub indisponible : on garde la version précédente plutôt que de tout vider.
        console.error(`Emploi du temps MMI${annee} indisponible :`, erreur);
        return dernierParAnnee.get(annee) ?? [];
      }
    }),
  );
  const tous = parAnnee.flat().sort((a, b) => a.debut.getTime() - b.debut.getTime());
  return indexer(tous);
}

/**
 * L'emploi du temps indexé, rechargé au plus une fois par heure.
 * Si plusieurs requêtes arrivent pendant un rechargement, elles attendent le même.
 */
async function getEmploiDuTemps(): Promise<EmploiDuTemps> {
  if (cache && Date.now() < cache.expire) return cache.emploi;
  enCours ??= construire()
    .then((emploi) => {
      cache = { emploi, expire: Date.now() + DUREE_CACHE_MS };
      return emploi;
    })
    .finally(() => {
      enCours = null;
    });
  return enCours;
}

// ------------------------------------------------------------------
// Requêtes utilisées par l'app
// ------------------------------------------------------------------

/** Tous les cours (d'une promo ou des trois), triés par heure de début. */
export async function getCours(annee?: Annee): Promise<Cours[]> {
  const { cours } = await getEmploiDuTemps();
  return annee ? cours.filter((c) => c.annee === annee) : cours;
}

/** Les cours d'un jour donné, éventuellement filtrés par promo. */
export async function getCoursDuJour(jour: Date, annee?: Annee): Promise<Cours[]> {
  const cours = (await getEmploiDuTemps()).parJour.get(cleJour(jour)) ?? [];
  return annee ? cours.filter((c) => c.annee === annee) : cours;
}

/** Les cours d'un enseignant (`enseignants.nom_ics`, ex. « THARAUD Sébastien ») un jour donné. */
export async function getCoursEnseignant(nomIcs: string, jour: Date): Promise<Cours[]> {
  return (await getCoursDuJour(jour)).filter((c) => c.enseignant === nomIcs);
}

/** Retrouve un cours par son UID ICS (ex. pour la page /dashboard/appel/[uid]). */
export async function getCoursParUid(uid: string): Promise<Cours | undefined> {
  return (await getEmploiDuTemps()).parUid.get(uid);
}

/** Un cours sur lequel on peut faire l'appel (pas annulé, pas en autonomie). */
export function estAppelable(cours: Cours): boolean {
  return !cours.annule && cours.type !== 'Autonomie';
}

export type CoursActuel = { cours: Cours; statut: 'en-cours' | 'a-venir' };

/**
 * Le cours à mettre en avant sur le dashboard d'un enseignant :
 *  - celui qui a lieu maintenant (ouvert 15 min avant le début, jusqu'à la fin) ;
 *  - sinon le prochain de la journée ;
 *  - sinon null (plus de cours aujourd'hui).
 */
export async function getCoursActuel(
  nomIcs: string,
  maintenant: Date = new Date(),
): Promise<CoursActuel | null> {
  const cours = (await getCoursEnseignant(nomIcs, maintenant)).filter(estAppelable);
  const t = maintenant.getTime();

  const actuel = cours.find(
    (c) => c.debut.getTime() - OUVERTURE_AVANT_MS <= t && t < c.fin.getTime(),
  );
  if (actuel) return { cours: actuel, statut: 'en-cours' };

  const prochain = cours.find((c) => c.debut.getTime() > t);
  return prochain ? { cours: prochain, statut: 'a-venir' } : null;
}
