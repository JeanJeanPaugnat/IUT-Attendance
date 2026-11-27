
// ------------------------------------------------------------------
// Appel MMI — cours issus des emplois du temps ICS (ADE)
// ------------------------------------------------------------------

/** Année de BUT : 1, 2 ou 3 (colonne `etudiants.annee`). */
export type Annee = 1 | 2 | 3;

export type TypeCours = 'CM' | 'TD' | 'TP' | 'Autonomie' | 'Autre';

/**
 * Un créneau de l'emploi du temps (un VEVENT de l'ICS).
 * Les cours ne sont pas stockés en base : `uid` sert de clé (colonne `presences.cours_uid`).
 */
export type Cours = {
  uid: string;
  annee: Annee;
  /** Code de la ressource / SAÉ, ex. « R5.DWeb-DI.06 », « SAÉ 5.Crea.01 ». */
  code: string;
  type: TypeCours;
  /** « NOM Prénom » tel qu'écrit dans l'ICS (= `enseignants.nom_ics`), null si non affecté. */
  enseignant: string | null;
  /** Groupes concernés, ex. ['G1', 'G2'] (= `etudiants.groupe`). Vide = toute la promo. */
  groupes: string[];
  salle: string | null;
  debut: Date;
  fin: Date;
  annule: boolean;
  evaluation: boolean;
  /** Résumé brut de l'ICS (affichage / debug). */
  resume: string;
};


export type Etudiant = {

  id: string;
  nom: string;
  prenom: string;
  email: string;
  annee: Annee;
  groupe: string | null;
  alternant?: boolean;
  path_photo?: string;

};

export type Enseignant = {

  id: string;
  nom: string;
  prenom: string;
  email: string;
  nomIcs: string;

};
