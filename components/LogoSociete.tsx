import { imageOptimisee } from "@/lib/imageOptimisee";

// Logo d'une societe partenaire : affiche en entier (jamais rogne) sur fond blanc ;
// a defaut de logo, ses initiales.
export default function LogoSociete({ nom, logoUrl, taille }: { nom: string; logoUrl: string; taille: "petit" | "moyen" | "grand" }) {
  const dimensions = { petit: "h-10 w-10 rounded-lg p-1", moyen: "h-24 w-24 rounded-2xl p-3", grand: "h-28 w-28 rounded-2xl p-3 sm:h-36 sm:w-36" }[taille];
  if (logoUrl) {
    return (
      <div className={dimensions + " flex shrink-0 items-center justify-center bg-white shadow-lg"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageOptimisee(logoUrl, 384)} alt={"Logo " + nom} loading="lazy" decoding="async" className="h-full w-full object-contain" />
      </div>
    );
  }
  const initiales = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase())
    .join("");
  return (
    <div className={dimensions + " flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 font-bold text-white shadow-lg"}>
      <span className={taille === "petit" ? "text-sm" : "text-3xl"}>{initiales}</span>
    </div>
  );
}
