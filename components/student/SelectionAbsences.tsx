"use client";

import { useState } from "react";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CarteEleve } from "./CarteEleve";

interface Eleve {
  id: number;
  prenom: string;
  nom: string;
  avatarUrl?: string;
}

interface SelectionAbsencesProps {
  eleves: Eleve[];
  onValider: (absents: number[]) => void | Promise<void>;
}

export function SelectionAbsences({
  eleves,
  onValider,
}: SelectionAbsencesProps) {
  const [absents, setAbsents] = useState<number[]>([]);
  const [chargement, setChargement] = useState(false);

  function selectionnerEleve(id: number) {
    setAbsents((precedents) =>
      precedents.includes(id)
        ? precedents.filter((eleveId) => eleveId !== id)
        : [...precedents, id]
    );
  }

  async function validerAbsences() {
    if (chargement) return;

    setChargement(true);

    try {
      await onValider(absents);
    } finally {
      setChargement(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />

          <h2 className="text-lg font-semibold">
            Qui est absent ?
          </h2>
        </div>

        <Badge variant="secondary">
          {absents.length} / {eleves.length}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {eleves.map((eleve) => (
          <CarteEleve
            key={eleve.id}
            id={eleve.id}
            prenom={eleve.prenom}
            nom={eleve.nom}
            avatarUrl={eleve.avatarUrl}
            selectionne={absents.includes(eleve.id)}
            onSelectionChange={selectionnerEleve}
          />
        ))}
      </div>

      <Button
        type="button"
        className="w-full"
        onClick={validerAbsences}
        disabled={chargement || eleves.length === 0}
      >
        {chargement
          ? "Enregistrement..."
          : `Valider les présences (${eleves.length - absents.length} présents)`}
      </Button>
    </section>
  );
}