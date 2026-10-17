// Adresse d'une photo du stockage Supabase servie par l'optimiseur d'images de Vercel :
// format WebP/AVIF, largeur adaptee, et surtout mise en cache pres du visiteur (au lieu
// d'aller chercher chaque photo chez Supabase). Autorise dans next.config.ts (remotePatterns).
//
// Largeurs possibles : celles de next.config.ts (images.deviceSizes / imageSizes).
export type LargeurImage = 256 | 384 | 640 | 828 | 1200 | 1920;

export function imageOptimisee(url: string | undefined | null, largeur: LargeurImage): string {
  if (!url) return "";
  // Seules les photos du stockage Supabase passent par l'optimiseur ; le reste est inchange.
  if (!url.includes(".supabase.co/storage/")) return url;
  return "/_next/image?url=" + encodeURIComponent(url) + "&w=" + largeur + "&q=75";
}
