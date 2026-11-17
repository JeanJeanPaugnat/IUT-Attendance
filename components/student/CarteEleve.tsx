"use client";

import { Check } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CarteEleveProps {
  id: number;
  prenom: string;
  nom: string;
  avatarUrl?: string;
  selectionne: boolean;
  onSelectionChange: (id: number) => void;
}

export function CarteEleve({
  id,
  prenom,
  nom,
  avatarUrl,
  selectionne,
  onSelectionChange,
}: CarteEleveProps) {
  const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`;

  return (
    <button
      type="button"
      onClick={() => onSelectionChange(id)}
      aria-pressed={selectionne}
      aria-label={`${selectionne ? "Désélectionner" : "Sélectionner"} ${prenom} ${nom} comme absent`}
      className={cn(
        "relative flex w-full flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-colors",
        selectionne
          ? "border-primary bg-primary/10"
          : "border-transparent bg-card hover:bg-accent"
      )}
    >
      {selectionne && (
        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" />
        </span>
      )}

      <Avatar className="size-16">
        <AvatarImage
          src={avatarUrl}
          alt={`${prenom} ${nom}`}
        />

        <AvatarFallback>
          {initiales.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="w-full text-center">
        <p className="truncate text-sm font-semibold">
          {prenom}
        </p>

        <p className="truncate text-xs text-muted-foreground">
          {nom}
        </p>
      </div>
    </button>
  );
}