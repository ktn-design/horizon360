"use client";

import { use, useEffect, useState } from "react";
import { getMaisonParId } from "@/lib/store";
import { notFound } from "next/navigation";
import Link from "next/link";
import VisiteVirtuelle from "@/components/VisiteVirtuelle";
import { Maison } from "@/types";

export default function VisitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [maison, setMaison] = useState<Maison | null>(null);
  const [charge, setCharge] = useState(false);
  const [panoramaActuel, setPanoramaActuel] = useState("");

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
      <Link
        href={"/maisons/" + maison.id}
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