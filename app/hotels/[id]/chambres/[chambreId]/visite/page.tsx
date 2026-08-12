"use client";

import { use, useEffect, useState } from "react";
import { getChambreParId, ChambreHotel } from "@/lib/store";
import { notFound } from "next/navigation";
import Link from "next/link";
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
    <main className="relative h-screen w-screen bg-black">
      <Link
        href={"/hotels/" + hotelId}
        className="absolute left-4 top-4 z-10 rounded-lg bg-slate-900/80 px-4 py-2 text-white hover:bg-slate-800"
      >
        Quitter la visite
      </Link>

      <VisiteVirtuelle
        panoramaUrl={panoramaActuel}
        hotspots={hotspotsActuels}
        onChangerPanorama={setPanoramaActuel}
      />
    </main>
  );
}