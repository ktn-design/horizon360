import { getImmeubles, getSocietes } from "@/lib/store";
import SocietesClient from "./SocietesClient";

// Page preparee sur le serveur et gardee en cache (voir app/page.tsx).
export const revalidate = 60;

export default async function Page() {
  const [societes, immeubles] = await Promise.all([getSocietes(), getImmeubles()]);
  const nbProjets: Record<string, number> = {};
  for (const im of immeubles) nbProjets[im.societeId] = (nbProjets[im.societeId] || 0) + 1;
  return <SocietesClient societes={societes} nbProjets={nbProjets} />;
}
