"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getChambreParId, sauvegarderChambre, ChambreHotel } from "@/lib/store";
import EditeurVisite360 from "@/components/EditeurVisite360";
import { Panorama360 } from "@/types";

export default function Visite360ChambrePage({ params }: { params: Promise<{ id: string; chambreId: string }> }) {
  const { id: hotelId, chambreId } = use(params);
  const router = useRouter();
  const [chambre, setChambre] = useState<ChambreHotel | null>(null);
  const [panoramas, setPanoramas] = useState<Panorama360[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const c = await getChambreParId(chambreId);
      if (c) {
        setChambre(c);
        setPanoramas(c.panoramas || []);
      }
      setCharge(true);
    }
    charger();
  }, [chambreId, router]);

  async function sauvegarder(nouvellesPanoramas: Panorama360[]) {
    setPanoramas(nouvellesPanoramas);
    if (!chambre) return;
    const chambreMaj: ChambreHotel = {
      ...chambre,
      panoramas: nouvellesPanoramas,
      visiteVirtuelle: nouvellesPanoramas.length > 0,
    };
    await sauvegarderChambre(chambreMaj);
    setChambre(chambreMaj);
  }

  if (!charge) return null;
  if (!chambre) return <p className="p-10 text-white">Chambre introuvable.</p>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href={"/admin/hotels/" + hotelId + "/chambres"} className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour aux chambres
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Visite 360 : {chambre.nom}</h1>
      <p className="mb-8 text-slate-400">
        Ajoute une photo 360 par angle/piece, puis clique sur "+ Ajouter un repere" et clique sur l'image pour placer un point qui menera vers une autre vue.
      </p>

      <EditeurVisite360 panoramas={panoramas} onChange={sauvegarder} />
    </main>
  );
}