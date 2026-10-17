"use client";

import { use, useEffect, useState } from "react";
import { getChambreParId, ChambreHotel } from "@/lib/store";
import { notFound } from "next/navigation";
import VisiteVirtuelle from "@/components/VisiteVirtuelle";

export default function VisiteChambrePage({ params }: { params: Promise<{ id: string; chambreId: string }> }) {
  const { id: hotelId, chambreId } = use(params);
  const [chambre, setChambre] = useState<ChambreHotel | null>(null);
  const [charge, setCharge] = useState(false);
  const [panoramaActuel, setPanoramaActuel] = useState("");

  useEffect(() => {
    async function charger() {
      const c = await getChambreParId(chambreId);
      setChambre(c || null);
      if (c) {
        const panoramas = c.panoramas || [];
        const defaut = panoramas.length > 0 ? panoramas[0].url : c.panorama360Url;
        if (defaut) setPanoramaActuel(defaut);
      }
      setCharge(true);
    }
    charger();
  }, [chambreId]);

  if (charge && !chambre) return notFound();
  if (!charge || !chambre || !panoramaActuel) return <main className="flex h-screen items-center justify-center bg-black text-white">Chargement...</main>;

  const panoramas = chambre.panoramas || [];
  const panoramaActif = panoramas.find((p) => p.url === panoramaActuel);
  const hotspotsActuels = panoramaActif ? panoramaActif.hotspots : [];

  return (
    <main className="fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-black">
      <VisiteVirtuelle
        adresseQuitter={"/hotels/" + hotelId}
        panoramaUrl={panoramaActuel}
        hotspots={hotspotsActuels}
        panoramas={panoramas}
        onChangerPanorama={setPanoramaActuel}
      />
    </main>
  );
}