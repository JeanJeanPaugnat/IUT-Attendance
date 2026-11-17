"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  CalendarDays,
  Users,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  {
    label: "Accueil",
    href: "/",
    icon: House,
  },
  {
    label: "Planning",
    href: "/planning",
    icon: CalendarDays,
  },
  {
    label: "Classes",
    href: "/classes",
    icon: Users,
  },
  {
    label: "Profil",
    href: "/profil",
    icon: UserRound,
  },
];

export function BarreNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {navigation.map(({ label, href, icon: Icon }) => {
          const actif =
            href === "/"
              ? pathname === href
              : pathname === href ||
                pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors",
                actif && "text-primary"
              )}
            >
              <Icon
                className="size-5"
                strokeWidth={actif ? 2.5 : 1.8}
                aria-hidden="true"
              />

              <span
                className={cn(
                  "text-xs",
                  actif && "font-semibold"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}