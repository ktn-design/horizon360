"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getHotelParId, getChambresParHotel, supprimerChambre, ChambreHotel } from "@/lib/store";

export default function ChambresAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: hotelId } = use(params);
  const router = useRouter();
  const [nomHotel, setNomHotel] = useState("");
  const [chambres, setChambres] = useState<ChambreHotel[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const connecte = localStorage.getItem("admin_connecte");
      if (connecte !== "true") {
        router.push("/admin");
        return;
      }
      const h = await getHotelParId(hotelId);
      setNomHotel(h ? h.titre : "Hotel");
      const c = await getChambresParHotel(hotelId);
      setChambres(c);
      setCharge(true);
    }
    charger();
  }, [hotelId, router]);

  async function handleSupprimer(id: string) {
    if (confirm("Supprimer cette chambre ?")) {
      await supprimerChambre(id);
      setChambres(await getChambresParHotel(hotelId));
    }
  }

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Chambres de {nomHotel}</h1>
        <Link href={"/admin/hotels/" + hotelId + "/chambres/nouveau"} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700">
          + Ajouter une chambre
        </Link>
      </div>

      <div className="space-y-4">
        {chambres.map((chambre) => (
          <div key={chambre.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800 p-5">
            <div className="flex items-center gap-4">
              {chambre.photos.length > 0 && (
                <img src={chambre.photos[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
              )}
              <div>
                <p className="font-semibold">{chambre.nom}</p>
                <p className="text-sm text-slate-400">
                  {chambre.prixParNuit.toLocaleString("fr-CA")} $/nuit - {chambre.capacite} personnes - {chambre.statut}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={"/admin/hotels/" + hotelId + "/chambres/" + chambre.id} className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">
                Modifier
              </Link>
              <Link href={"/admin/hotels/" + hotelId + "/chambres/" + chambre.id + "/visite360"} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-700">
                Visite 360
              </Link>
              <button onClick={() => handleSupprimer(chambre.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {chambres.length === 0 && <p className="text-slate-400">Aucune chambre ajoutee pour l'instant.</p>}
    </main>
  );
}