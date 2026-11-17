"use client";

import { useState } from "react";
import { Entete } from "@/components/navigation/Entete";
import { CalendrierSemaine } from "@/components/planning/CalendrierSemaine";
import { CarteCours } from "@/components/planning/CarteCours";
import { SelectionAbsences } from "@/components/student/SelectionAbsences";

const cours = {
  id: 1,
  matiere: "Design graphique",
  classe: "BTS Communication - 1re année",
  salle: "Salle B12",
  heureDebut: "09:00",
  heureFin: "11:00",
  nombreEleves: 6,
  statut: "en_cours" as const,
};

const eleves = [
  { id: 1, prenom: "Alice", nom: "Bernard" },
  { id: 2, prenom: "Amine", nom: "Benali" },
  { id: 3, prenom: "Chloé", nom: "Martin" },
  { id: 4, prenom: "Ethan", nom: "Dubois" },
  { id: 5, prenom: "Inès", nom: "Petit" },
  { id: 6, prenom: "Jules", nom: "Robert" },
];

export function Accueil() {
  const [dateSelectionnee, setDateSelectionnee] = useState(
    new Date(2025, 4, 14)
  );

  async function validerAbsences(absents: number[]) {
    console.log("Absents sélectionnés :", absents);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-6 bg-background p-4 pb-28">
      <section className="space-y-6 rounded-3xl bg-card p-4">
        <Entete prenom="Sophie" nom="Lefèvre" />

        <CalendrierSemaine
          dateSelectionnee={dateSelectionnee}
          onDateChange={setDateSelectionnee}
        />
      </section>

      <CarteCours cours={cours} />

      <SelectionAbsences
        eleves={eleves}
        onValider={validerAbsences}
      />
    </main>
  );
}