"use client";

import { use, useEffect, useState } from "react";
import { getSalleParId } from "@/lib/store";
import { notFound } from "next/navigation";
import Link from "next/link";
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
      <Link
        href={"/salles/" + salle.id}
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-20 rounded-full border border-white/20 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md hover:bg-slate-900/70"
      >
        Quitter la visite
      </Link>

      <VisiteVirtuelle
        panoramaUrl={panoramaActuel}
        hotspots={hotspotsActuels}
        panoramas={panoramas}
        onChangerPanorama={setPanoramaActuel}
      />
    </main>
  );
}