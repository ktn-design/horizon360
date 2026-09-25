"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getHotelParId, sauvegarderHotel } from "@/lib/store";
import EditeurVisite360 from "@/components/EditeurVisite360";
import { Hotel, Panorama360 } from "@/types";

export default function Visite360HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [panoramas, setPanoramas] = useState<Panorama360[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const h = await getHotelParId(id);
      if (h) {
        setHotel(h);
        setPanoramas(h.panoramas || []);
      }
      setCharge(true);
    }
    charger();
  }, [id, router]);

  async function sauvegarder(nouvellesPanoramas: Panorama360[]) {
    setPanoramas(nouvellesPanoramas);
    if (!hotel) return;
    const hotelMaj: Hotel = {
      ...hotel,
      panoramas: nouvellesPanoramas,
      visiteVirtuelle: nouvellesPanoramas.length > 0,
    };
    await sauvegarderHotel(hotelMaj);
    setHotel(hotelMaj);
  }

  if (!charge) return null;
  if (!hotel) return <p className="p-10 text-white">Hotel introuvable.</p>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Visite 360 : {hotel.titre}</h1>
      <p className="mb-8 text-slate-400">
        Ajoute une photo 360 par piece, puis clique sur "+ Ajouter un repere" et clique sur l'image pour placer un point qui menera vers une autre piece.
      </p>

      <EditeurVisite360 panoramas={panoramas} onChange={sauvegarder} />
    </main>
  );
}