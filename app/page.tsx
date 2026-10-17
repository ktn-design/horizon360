import { getParametres } from "@/lib/store";
import AccueilClient from "./AccueilClient";

// Page preparee sur le serveur et gardee en cache par Vercel : le visiteur recoit
// directement la page remplie. Rafraichie au plus tard toutes les 60 s, et tout de suite
// quand l'admin enregistre une modification (app/api/revalider).
export const revalidate = 60;

export default async function Page() {
  const parametres = await getParametres();
  return <AccueilClient parametres={parametres} />;
}
