import { Clock3, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Cours {
  id: number;
  matiere: string;
  classe: string;
  salle: string;
  heureDebut: string;
  heureFin: string;
  nombreEleves: number;
  statut: "en_cours" | "a_venir" | "termine";
}

interface CarteCoursProps {
  cours: Cours;
  className?: string;
}

const STATUTS = {
  en_cours: "En cours",
  a_venir: "À venir",
  termine: "Terminé",
} satisfies Record<Cours["statut"], string>;

export function CarteCours({
  cours,
  className,
}: CarteCoursProps) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-3xl border-0 bg-primary py-0 text-primary-foreground shadow-none",
        className
      )}
    >
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                cours.statut === "en_cours"
                  ? "bg-green-400"
                  : "bg-primary-foreground/50"
              )}
            />

            <span className="text-sm">
              {STATUTS[cours.statut]}
            </span>
          </div>

          <Badge
            variant="secondary"
            className="rounded-full"
          >
            {cours.salle}
          </Badge>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-semibold">
            {cours.matiere}
          </h3>

          <p className="text-sm text-primary-foreground/70">
            {cours.classe}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4" />
            <span>
              {cours.heureDebut} - {cours.heureFin}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="size-4" />
            <span>{cours.nombreEleves} élèves</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span>{cours.salle}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}