"use client";

import { use, useEffect, useState } from "react";
import { getHotelParId } from "@/lib/store";
import { notFound } from "next/navigation";
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
    <main className="fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-black">
      <VisiteVirtuelle
        adresseQuitter={"/hotels/" + hotel.id}
        panoramaUrl={panoramaActuel}
        hotspots={hotspotsActuels}
        panoramas={panoramas}
        onChangerPanorama={setPanoramaActuel}
      />
    </main>
  );
}