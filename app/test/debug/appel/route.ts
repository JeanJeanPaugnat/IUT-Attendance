// Route de TEST (développement uniquement) : simule le dashboard d'un prof.
//
//   http://localhost:3000/api/debug/appel?prof=MORA Frédéric
//   http://localhost:3000/api/debug/appel?prof=MORA Frédéric&quand=2026-11-17T15:10
//
// 1. cherche le cours actuel du prof dans l'ICS (getCoursActuel)
// 2. récupère les élèves correspondants dans Supabase (annee + groupes)
// À supprimer (ou laisser : elle renvoie 404 en production).

import postgres from 'postgres';
import { getCoursActuel, getCoursEnseignant } from '@/app/lib/calendar';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const prof = params.get('prof');
  if (!prof) {
    return Response.json({ erreur: 'Paramètre ?prof=NOM Prénom manquant' }, { status: 400 });
  }
  // « 2026-11-17T15:10 » est lu en heure de Paris ; sans paramètre = maintenant.
  const quand = params.get('quand');
  const maintenant = quand ? new Date(`${quand}:00${decalageParis(quand)}`) : new Date();

  const debut = performance.now();

  // ① prof -> cours (ICS en mémoire)
  const coursDuJour = await getCoursEnseignant(prof, maintenant);
  const actuel = await getCoursActuel(prof, maintenant);
  const msIcs = performance.now() - debut;

  if (!actuel) {
    return Response.json({
      prof,
      maintenant: maintenant.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      coursActuel: null,
      coursDuJour: coursDuJour.map(resumer),
      message: 'Aucun cours en cours ou à venir aujourd’hui pour ce prof (vérifiez le nom exact : « NOM Prénom »).',
    });
  }

  // ② cours -> élèves (Supabase)
  const { cours } = actuel;
  const debutSql = performance.now();
  const eleves = await sql`
    SELECT nom, prenom, groupe, alternant
    FROM etudiants
    WHERE annee = ${cours.annee} AND groupe = ANY(${cours.groupes})
    ORDER BY nom, prenom`;
  const msSql = performance.now() - debutSql;

  return Response.json({
    prof,
    maintenant: maintenant.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
    coursActuel: { statut: actuel.statut, ...resumer(cours) },
    eleves: { total: eleves.length, liste: eleves },
    coursDuJour: coursDuJour.map(resumer),
    temps: { icsMs: Math.round(msIcs), sqlMs: Math.round(msSql) },
  });
}

function resumer(c: Awaited<ReturnType<typeof getCoursEnseignant>>[number]) {
  const heure = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
  return {
    uid: c.uid,
    horaire: `${heure(c.debut)} – ${heure(c.fin)}`,
    code: c.code,
    type: c.type,
    promo: `BUT${c.annee}`,
    groupes: c.groupes,
    salle: c.salle,
    annule: c.annule,
  };
}

/** « +01:00 » en hiver, « +02:00 » en été, pour lire ?quand= en heure de Paris. */
function decalageParis(dateLocale: string): string {
  const approx = new Date(`${dateLocale}:00Z`);
  const nom = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
    .formatToParts(approx)
    .find((p) => p.type === 'timeZoneName')?.value; // « GMT+1 »
  const heures = Number(nom?.replace('GMT', '') || 0);
  return `${heures >= 0 ? '+' : '-'}${String(Math.abs(heures)).padStart(2, '0')}:00`;
}
