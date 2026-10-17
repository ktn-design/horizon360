import { getParametres, getSalles } from "@/lib/store";
import SallesClient from "./SallesClient";

// Liste preparee sur le serveur et gardee en cache (voir app/page.tsx).
export const revalidate = 60;

export default async function Page() {
  const [salles, parametres] = await Promise.all([getSalles(), getParametres()]);
  return <SallesClient salles={salles} parametres={parametres} />;
}
