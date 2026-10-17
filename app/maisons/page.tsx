import { getMaisons, getParametres } from "@/lib/store";
import MaisonsClient from "./MaisonsClient";

// Liste preparee sur le serveur et gardee en cache (voir app/page.tsx).
export const revalidate = 60;

export default async function Page() {
  const [maisons, parametres] = await Promise.all([getMaisons(), getParametres()]);
  return <MaisonsClient maisons={maisons} parametres={parametres} />;
}
