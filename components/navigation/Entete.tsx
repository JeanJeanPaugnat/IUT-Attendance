import Link from "next/link";
import { Bell } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface EnteteProps {
  prenom: string;
  nom: string;
  avatarUrl?: string;
}

export function Entete({
  prenom,
  nom,
  avatarUrl,
}: EnteteProps) {
  const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`;

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Bonjour,
        </p>

        <h1 className="text-2xl font-semibold">
          {prenom} {nom}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <Link href="/notifications">
            <Bell className="size-5" />
          </Link>
        </Button>

        <Link href="/profil" aria-label="Voir mon profil">
          <Avatar className="size-11">
            <AvatarImage
              src={avatarUrl}
              alt={`${prenom} ${nom}`}
            />

            <AvatarFallback>
              {initiales.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}