import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import { BarreNavigation } from "@/components/navigation/BarreNav";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Gestion des absences",
    default: "Gestion des absences",
  },
  description: "Application de gestion des présences et absences des élèves.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} antialiased`}>
        {children}

        {/* <BarreNavigation /> */}
      </body>
    </html>
  );
}