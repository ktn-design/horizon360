"use client";

import { use, useEffect, useState } from "react";
import { getHotelParId } from "@/lib/store";
import { notFound } from "next/navigation";
import Link from "next/link";
import VisiteVirtuelle from "@/components/VisiteVirtuelle";
import { Hotel } from "@/types";

export default function VisiteHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [charge, setCharge] = useState(false);
  const [panoramaActuel, setPanoramaActuel] = useState("");

  useEffect(() => {
    async function charger() {
      const h = await getHotelParId(id);
      setHotel(h || null);
      if (h) {
        const panoramas = h.panoramas || [];
        const defaut = panoramas.length > 0 ? panoramas[0].url : h.panorama360Url;
        if (defaut) setPanoramaActuel(defaut);
      }
      setCharge(true);
    }
    charger();
  }, [id]);

  if (charge && !hotel) return notFound();
  if (!charge || !hotel || !panoramaActuel) return <main className="flex h-screen items-center justify-center bg-black text-white">Chargement...</main>;

  const panoramas = hotel.panoramas || [];
  const panoramaActif = panoramas.find((p) => p.url === panoramaActuel);
  const hotspotsActuels = panoramaActif ? panoramaActif.hotspots : [];

  return (
    <main className="relative h-screen w-screen bg-black">
      <Link
        href={"/hotels/" + hotel.id}
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