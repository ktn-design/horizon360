// Le service de geolocalisation a renvoye le meme pays sous plusieurs noms (« Congo (DRC) »,
// « DR Congo », « Democratic Republic of the Congo »...) : un seul nom dans les statistiques.
export function normaliserPays(pays: string | null | undefined): string {
  if (!pays) return "";
  const p = pays.toLowerCase();
  if (/congo/.test(p) && /(dr|democratic|democratique|démocratique|rdc|kinshasa)/.test(p)) return "RD Congo";
  if (/^(republic of (the )?)?congo$|congo-brazzaville|congo \(republic\)/.test(p)) return "Congo-Brazzaville";
  return pays;
}
