// Génère supabase/seed.sql à partir des CSV du dossier data/.
//   node scripts/generate-seed.mjs
// Puis coller supabase/seed.sql dans Supabase > SQL Editor > Run.
//
// Entrées :
//   data/enseignants.csv       NOM,Prénom,Email          (séparateur ,)
//   data/etudiants*.csv        Nom;Prénom;Groupe;Année   (séparateur ;)
//
// Le SQL produit peut être relancé : les lignes existantes sont mises à jour.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'data');
const warnings = [];

function readCsv(file, separator) {
  const [, ...rows] = readFileSync(path.join(DATA, file), 'utf8')
    .replace(/^﻿/, '') // BOM Excel
    .split(/\r?\n/)
    .filter((line) => line.trim());
  return rows.map((line) => line.split(separator).map((cell) => cell.trim()));
}

const sqlString = (value) => (value == null ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`);
const stripAccents = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');

// ---------- Enseignants ----------

function cleanEmail(raw, label) {
  const email = stripAccents(raw.toLowerCase())
    .replace(/\.@/, '@') // « audrey.moutat.@unilim.fr »
    .replace(/\s+/g, '-'); // « emma.le bail.aff@ »
  if (email !== raw) warnings.push(`Email corrigé (${label}) : ${raw} -> ${email}`);
  if (!/^[a-z0-9.-]+@[a-z0-9.-]+\.[a-z]+$/.test(email)) {
    warnings.push(`Email suspect (${label}) : ${email}`);
  }
  return email;
}

const teachers = readCsv('enseignants.csv', ',').map(([nom, prenom, email]) => ({
  nom,
  prenom,
  email: cleanEmail(email, `${nom} ${prenom}`),
  // Format utilisé par ADE dans les ICS : « NOM Prénom »
  nomIcs: `${nom} ${prenom}`,
}));

// ---------- Étudiants ----------

const studentFiles = readdirSync(DATA).filter((f) => /^etudiants.*\.csv$/i.test(f));

const students = studentFiles.flatMap((file) =>
  readCsv(file, ';').map(([rawNom, prenom, rawGroupe, rawAnnee]) => {
    const label = `${file} : ${rawNom} ${prenom}`;
    // « DELVAQUE - CA » -> nom « DELVAQUE », alternant
    const alternant = /\s*-\s*CA$/i.test(rawNom);
    const nom = rawNom.replace(/\s*-\s*CA$/i, '').trim();
    // « TD1 - G2 » -> « G2 »
    const groupe = rawGroupe.match(/G([1-4])/)?.[0];
    // « MMI3 » ou « BUT3 » -> 3
    const annee = Number(rawAnnee.match(/([1-3])\s*$/)?.[1]);
    if (!groupe || !annee) throw new Error(`Ligne invalide (${label}) : ${rawGroupe} / ${rawAnnee}`);
    return { nom, prenom, groupe, annee, alternant };
  }),
);

// ---------- SQL ----------

const teacherValues = teachers
  .map((t) => `  (${[t.nom, t.prenom, t.email, t.nomIcs].map(sqlString).join(', ')})`)
  .join(',\n');

const studentValues = students
  .map((s) => `  (${sqlString(s.nom)}, ${sqlString(s.prenom)}, ${s.annee}, ${sqlString(s.groupe)}, ${s.alternant})`)
  .join(',\n');

const sql = `-- Généré par scripts/generate-seed.mjs le ${new Date().toISOString()}
-- ${teachers.length} enseignants, ${students.length} étudiants. NE PAS VERSIONNER (données personnelles).
BEGIN;

INSERT INTO enseignants (nom, prenom, email, nom_ics) VALUES
${teacherValues}
ON CONFLICT (email) DO UPDATE
  SET nom = EXCLUDED.nom, prenom = EXCLUDED.prenom, nom_ics = EXCLUDED.nom_ics;

INSERT INTO etudiants (nom, prenom, annee, groupe, alternant) VALUES
${studentValues}
ON CONFLICT (nom, prenom, annee) DO UPDATE
  SET groupe = EXCLUDED.groupe, alternant = EXCLUDED.alternant;

COMMIT;
`;

writeFileSync(path.join(ROOT, 'supabase', 'seed.sql'), sql);

const count = (annee) => {
  const list = students.filter((s) => s.annee === annee);
  const byGroup = Object.entries(Object.groupBy(list, (s) => s.groupe))
    .sort()
    .map(([g, l]) => `${g}: ${l.length}`)
    .join(', ');
  return `  BUT${annee} : ${list.length} (${byGroup})`;
};

console.log(`supabase/seed.sql généré : ${teachers.length} enseignants, ${students.length} étudiants`);
console.log([1, 2, 3].map(count).join('\n'));
console.log(`  dont alternants : ${students.filter((s) => s.alternant).length}`);
if (warnings.length) console.log(`\nÀ vérifier :\n- ${warnings.join('\n- ')}`);
