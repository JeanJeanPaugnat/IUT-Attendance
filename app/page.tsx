import { lusitana } from '@/app/ui/fonts';
import { getCoursAvecEleves } from '@/app/lib/appel';
import { FUSEAU } from '@/app/lib/calendar';

// Toujours recalculé à la requête : le cours actuel dépend de l'heure.
export const dynamic = 'force-dynamic';

const heure = (d: Date) =>
  d.toLocaleTimeString('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit' });

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ prof?: string }>;
}) {
  // TODO : remplacer par le nom_ics de l'enseignant connecté (session next-auth).
  const { prof } = await searchParams;

  if (!prof) {
    return (
      <main className="p-6">
        <p>Ajoutez <code>?prof=NOM Prénom</code> à l’URL.</p>
      </main>
    );
  }

  const data = await getCoursAvecEleves(prof);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <h1 className={`${lusitana.className} text-2xl md:text-3xl`}>Appel — {prof}</h1>

      {!data ? (
        <p className="text-gray-600">Aucun cours en cours ou à venir aujourd’hui.</p>
      ) : (
        <>
          <section className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              {data.statut === 'en-cours' ? 'En cours' : 'À venir'}
            </p>
            <p className="text-lg font-medium">
              {data.cours.code} · {data.cours.type}
            </p>
            <p className="text-gray-700">
              {heure(data.cours.debut)} – {heure(data.cours.fin)} · BUT{data.cours.annee}{' '}
              {data.cours.groupes.join(', ') || 'promo entière'}
              {data.cours.salle && ` · ${data.cours.salle}`}
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-medium">Élèves ({data.eleves.length})</h2>
            <ul className="divide-y rounded-lg border">
              {data.eleves.map((e) => (
                <li key={e.id} className="flex justify-between px-4 py-2">
                  <span>
                    {e.nom} {e.prenom}
                  </span>
                  <span className="text-sm text-gray-500">
                    {e.groupe}
                    {e.alternant && ' · alternant'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
