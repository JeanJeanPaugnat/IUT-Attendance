"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendrierSemaineProps {
  dateSelectionnee: Date;
  onDateChange: (date: Date) => void;
}

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendrierSemaine({
  dateSelectionnee,
  onDateChange,
}: CalendrierSemaineProps) {
  const debutSemaine = new Date(dateSelectionnee);

  debutSemaine.setDate(
    dateSelectionnee.getDate() -
      ((dateSelectionnee.getDay() + 6) % 7)
  );

  const dates = JOURS.map((_, index) => {
    const date = new Date(debutSemaine);
    date.setDate(debutSemaine.getDate() + index);
    return date;
  });

  function changerSemaine(decalage: number) {
    const date = new Date(dateSelectionnee);
    date.setDate(date.getDate() + decalage * 7);
    onDateChange(date);
  }

  const mois = dateSelectionnee.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
          {mois}
        </h2>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => changerSemaine(-1)}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => changerSemaine(1)}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dates.map((date, index) => {
          const selectionnee =
            date.toDateString() === dateSelectionnee.toDateString();

          return (
            <Button
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
              type="button"
              variant="ghost"
              onClick={() => onDateChange(date)}
              aria-pressed={selectionnee}
              className={cn(
                "flex h-auto flex-col gap-2 rounded-xl px-1 py-3",
                selectionnee &&
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
            >
              <span className="text-xs">
                {JOURS[index]}
              </span>

              <span className="text-base font-semibold">
                {date.getDate()}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}