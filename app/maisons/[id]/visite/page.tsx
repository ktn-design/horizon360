"use client";

import { use, useEffect, useState } from "react";
import { getImmeubleParId, getMaisonParId } from "@/lib/store";
import { notFound } from "next/navigation";
import VisiteVirtuelle, { EmplacementAppartement } from "@/components/VisiteVirtuelle";
import { Maison } from "@/types";

export default function VisitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [maison, setMaison] = useState<Maison | null>(null);
  const [charge, setCharge] = useState(false);
  const [panoramaActuel, setPanoramaActuel] = useState("");
  const [emplacement, setEmplacement] = useState<EmplacementAppartement | undefined>();

  useEffect(() => {
    async function charger() {
      const m = await getMaisonParId(id);
      setMaison(m || null);
      if (m) {
        const panoramas = m.panoramas || [];
        const defaut = panoramas.length > 0 ? panoramas[0].url : m.panorama360Url;
        if (defaut) setPanoramaActuel(defaut);
      }
      setCharge(true);

      // Appartement situe sur la maquette de son immeuble : bouton « Situer l'appartement ».
      // Le visiteur ne voit que le repere de CET appartement.
      if (m?.immeubleId) {
        const immeuble = await getImmeubleParId(m.immeubleId);
        const repere = immeuble?.reperesMaquette?.find((r) => r.maisonId === m.id);
        if (immeuble?.maquette3dUrl && repere) {
          setEmplacement({ maquetteUrl: immeuble.maquette3dUrl, nomImmeuble: immeuble.nom, repere });
        }
      }
    }
    charger();
  }, [id]);

  if (charge && !maison) return notFound();
  if (!charge || !maison || !panoramaActuel) return <main className="flex h-screen items-center justify-center bg-black text-white">Chargement...</main>;

  const panoramas = maison.panoramas || [];
  const panoramaActif = panoramas.find((p) => p.url === panoramaActuel);
  const hotspotsActuels = panoramaActif ? panoramaActif.hotspots : [];

  return (
    <main className="fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-black">
      <VisiteVirtuelle
        adresseQuitter={"/maisons/" + maison.id}
        panoramaUrl={panoramaActuel}
        hotspots={hotspotsActuels}
        panoramas={panoramas}
        onChangerPanorama={setPanoramaActuel}
        emplacement={emplacement}
      />
    </main>
  );
}