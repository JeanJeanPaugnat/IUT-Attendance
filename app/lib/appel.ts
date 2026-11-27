// Données de l'appel : le cours actuel d'un enseignant + les élèves concernés.
// À n'utiliser que côté serveur (Server Components, Server Actions, routes).

import postgres from 'postgres';
import { getCoursActuel, type CoursActuel } from './calendar';
import type { Etudiant } from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

export type EleveAppel = Pick<Etudiant, 'id' | 'nom' | 'prenom' | 'groupe' | 'alternant'>;

export type CoursAvecEleves = CoursActuel & { eleves: EleveAppel[] };

/**
 * Le cours à mettre en avant pour un enseignant (« NOM Prénom » de l'ICS)
 * avec la liste de ses élèves, ou null s'il n'a plus de cours aujourd'hui.
 */
export async function getCoursAvecEleves(
  nomIcs: string,
  maintenant: Date = new Date(),
): Promise<CoursAvecEleves | null> {
  const actuel = await getCoursActuel(nomIcs, maintenant);
  if (!actuel) return null;

  const { cours } = actuel;
  // Pas de groupe dans l'ICS = toute la promo (CM).
  const eleves = cours.groupes.length
    ? await sql<EleveAppel[]>`
        SELECT id, nom, prenom, groupe, alternant
        FROM etudiants
        WHERE annee = ${cours.annee} AND groupe = ANY(${cours.groupes})
        ORDER BY nom, prenom`
    : await sql<EleveAppel[]>`
        SELECT id, nom, prenom, groupe, alternant
        FROM etudiants
        WHERE annee = ${cours.annee}
        ORDER BY nom, prenom`;

  return { ...actuel, eleves };
}
