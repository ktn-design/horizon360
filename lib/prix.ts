import { Extra, FacturationExtra } from "@/types";

// Extra retenu dans une reservation : copie du nom et du prix au moment de la reservation,
// pour que l'historique (admin, PDF, mon compte) reste juste si l'admin change ses tarifs.
export interface ExtraChoisi {
  id: string;
  nom: string;
  prix: number;
  facturation: FacturationExtra;
  quantite: number;
  total: number;
}

export const LIBELLES_FACTURATION: Record<FacturationExtra, string> = {
  forfait: "forfait",
  par_nuit: "par nuit",
  par_personne: "par personne",
  par_personne_par_nuit: "par personne et par nuit",
};

export function extraParPersonne(extra: { facturation: FacturationExtra }): boolean {
  return extra.facturation === "par_personne" || extra.facturation === "par_personne_par_nuit";
}

// Calcule le detail et le total des extras choisis. Toujours recalcule a partir des tarifs
// de l'admin (jamais a partir d'un prix envoye par le navigateur).
// Pour une salle, nuits = 1 : "par nuit" revient alors a un forfait.
export function calculerExtras(
  extrasDisponibles: Extra[],
  idsChoisis: string[],
  nuits: number,
  nombrePersonnes: number
): { lignes: ExtraChoisi[]; total: number } {
  const nuitsComptees = Math.max(1, nuits);
  const personnes = Math.max(1, nombrePersonnes || 1);

  const lignes = extrasDisponibles
    .filter((e) => idsChoisis.includes(e.id))
    .map((e) => {
      let quantite = 1;
      if (e.facturation === "par_nuit") quantite = nuitsComptees;
      if (e.facturation === "par_personne") quantite = personnes;
      if (e.facturation === "par_personne_par_nuit") quantite = personnes * nuitsComptees;
      return { id: e.id, nom: e.nom, prix: e.prix, facturation: e.facturation, quantite, total: e.prix * quantite };
    });

  return { lignes, total: lignes.reduce((somme, l) => somme + l.total, 0) };
}

export function nombreNuits(dateDebut: string, dateFin: string): number {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  return Math.round((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
}

// Nettoie ce que le navigateur envoie : liste d'identifiants texte et nombre de personnes raisonnable.
export function lireExtrasIds(valeur: unknown): string[] {
  if (!Array.isArray(valeur)) return [];
  return valeur.filter((v): v is string => typeof v === "string").slice(0, 25);
}

export function lireNombrePersonnes(valeur: unknown): number {
  const n = Math.floor(Number(valeur));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 10000) : 1;
}

// Maximum d'un curseur de prix : le prix le plus eleve du catalogue, arrondi au pas superieur,
// pour qu'aucun bien ne soit jamais cache par un plafond fixe.
export function plafondPrix(prix: number[], pas: number): number {
  const max = Math.max(0, ...prix.filter((p) => Number.isFinite(p)));
  return Math.max(pas, Math.ceil(max / pas) * pas);
}
