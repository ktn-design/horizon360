"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSalleParId, sauvegarderSalle } from "@/lib/store";
import EditeurVisite360 from "@/components/EditeurVisite360";
import { Salle, Panorama360 } from "@/types";

export default function Visite360SallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [salle, setSalle] = useState<Salle | null>(null);
  const [panoramas, setPanoramas] = useState<Panorama360[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const s = await getSalleParId(id);
      if (s) {
        setSalle(s);
        setPanoramas(s.panoramas || []);
      }
      setCharge(true);
    }
    charger();
  }, [id, router]);

  async function sauvegarder(nouvellesPanoramas: Panorama360[]) {
    setPanoramas(nouvellesPanoramas);
    if (!salle) return;
    const salleMaj: Salle = {
      ...salle,
      panoramas: nouvellesPanoramas,
      visiteVirtuelle: nouvellesPanoramas.length > 0,
    };
    await sauvegarderSalle(salleMaj);
    setSalle(salleMaj);
  }

  if (!charge) return null;
  if (!salle) return <p className="p-10 text-white">Salle introuvable.</p>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Visite 360 : {salle.titre}</h1>
      <p className="mb-8 text-slate-400">
        Ajoute une photo 360 par piece, puis clique sur "+ Ajouter un repere" et clique sur l'image pour placer un point qui menera vers une autre piece.
      </p>

      <EditeurVisite360 panoramas={panoramas} onChange={sauvegarder} />
    </main>
  );
}