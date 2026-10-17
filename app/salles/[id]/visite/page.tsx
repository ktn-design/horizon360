"use client";

import { use, useEffect, useState } from "react";
import { getSalleParId } from "@/lib/store";
import { notFound } from "next/navigation";
import VisiteVirtuelle from "@/components/VisiteVirtuelle";
import { Salle } from "@/types";

export default function VisiteSallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [salle, setSalle] = useState<Salle | null>(null);
  const [charge, setCharge] = useState(false);
  const [panoramaActuel, setPanoramaActuel] = useState("");

  useEffect(() => {
    async function charger() {
      const s = await getSalleParId(id);
      setSalle(s || null);
      if (s) {
        const panoramas = s.panoramas || [];
        const defaut = panoramas.length > 0 ? panoramas[0].url : s.panorama360Url;
        if (defaut) setPanoramaActuel(defaut);
      }
      setCharge(true);
    }
    charger();
  }, [id]);

  if (charge && !salle) return notFound();
  if (!charge || !salle || !panoramaActuel) return <main className="flex h-screen items-center justify-center bg-black text-white">Chargement...</main>;

  const panoramas = salle.panoramas || [];
  const panoramaActif = panoramas.find((p) => p.url === panoramaActuel);
  const hotspotsActuels = panoramaActif ? panoramaActif.hotspots : [];

  return (
    <main className="fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-black">
      <VisiteVirtuelle
        adresseQuitter={"/salles/" + salle.id}
        panoramaUrl={panoramaActuel}
        hotspots={hotspotsActuels}
        panoramas={panoramas}
        onChangerPanorama={setPanoramaActuel}
      />
    </main>
  );
}