import { Reservation } from "./store";

export function periodesSeChevauchent(debut1: string, fin1: string, debut2: string, fin2: string): boolean {
  return debut1 < fin2 && debut2 < fin1;
}

// Pour un hotel : si chambreId est fourni, ne bloque que les reservations de la meme chambre.
// Si l'hotel n'a pas de chambres configurees (chambreId absent), bloque au niveau de l'hotel entier
// (comportement historique, retro-compatible).
export function periodeHotelDisponible(
  reservationsExistantes: Reservation[],
  chambreId: string | undefined,
  dateDebut: string,
  dateFin: string
): boolean {
  const pertinentes = reservationsExistantes.filter((r) => (r.chambreId || undefined) === chambreId);
  return !pertinentes.some((r) => periodesSeChevauchent(dateDebut, dateFin, r.dateDebut, r.dateFin));
}

export function creneauSalleDisponible(
  reservationsExistantes: Reservation[],
  date: string,
  creneau: string
): boolean {
  const creneauxPris = reservationsExistantes.filter((r) => r.dateDebut === date).map((r) => r.creneau);
  const journeeIndisponible = creneauxPris.includes("journee");
  const matinPris = creneauxPris.includes("matin") || journeeIndisponible;
  const apresMidiPris = creneauxPris.includes("apres_midi") || journeeIndisponible;

  if (creneau === "matin") return !matinPris;
  if (creneau === "apres_midi") return !apresMidiPris;
  if (creneau === "journee") return !matinPris && !apresMidiPris;
  return false;
}
