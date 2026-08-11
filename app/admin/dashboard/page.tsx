"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMaisons, getHotels, getSalles } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Maison, Hotel, Salle } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);

  useEffect(() => {
    async function verifierEtCharger() {
      const connecte = localStorage.getItem("admin_connecte");
      if (connecte !== "true") {
        router.push("/admin");
        return;
      }
      const [m, h, s] = await Promise.all([getMaisons(), getHotels(), getSalles()]);
      setMaisons(m);
      setHotels(h);
      setSalles(s);
      setPret(true);
    }
    verifierEtCharger();
  }, [router]);

  async function deconnexion() {
    await supabase.auth.signOut();
    localStorage.removeItem("admin_connecte");
    router.push("/admin");
  }

  if (!pret) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <button
          onClick={deconnexion}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
        >
          Se deconnecter
        </button>
      </div>

      <div className="mb-10 flex flex-wrap gap-4">
        <Link href="/admin/maisons/nouveau" className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700">
          + Ajouter une maison
        </Link>
        <Link href="/admin/hotels/nouveau" className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700">
          + Ajouter un hotel
        </Link>
        <Link href="/admin/salles/nouveau" className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700">
          + Ajouter une salle
        </Link>
        <Link href="/admin/parametres" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
          Parametres du site
        </Link>
        <Link href="/admin/societes" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
          Societes et immeubles
        </Link>
        <Link href="/admin/messages" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
          Messages de contact
        </Link>
        <Link href="/admin/reservations" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
          Reservations
        </Link>
      </div>

      <h2 className="mb-4 text-xl font-semibold">Maisons ({maisons.length})</h2>
      <div className="mb-10 overflow-hidden rounded-xl bg-slate-800">
        {maisons.map((maison) => (
          <div key={maison.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-4 last:border-none">
            <div>
              <p className="font-semibold">{maison.titre}</p>
              <p className="text-sm text-slate-400">{maison.localisation.ville} - {maison.prix.toLocaleString("fr-CA")} dollars - {maison.statut}</p>
            </div>
            <div className="flex gap-2">
              <Link href={"/admin/maisons/" + maison.id} className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">
                Modifier
              </Link>
              <Link href={"/admin/maisons/" + maison.id + "/visite360"} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-700">
                Visite 360
              </Link>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-xl font-semibold">Hotels ({hotels.length})</h2>
      <div className="mb-10 overflow-hidden rounded-xl bg-slate-800">
        {hotels.map((hotel) => (
          <div key={hotel.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-4 last:border-none">
            <div>
              <p className="font-semibold">{hotel.titre}</p>
              <p className="text-sm text-slate-400">{hotel.localisation.ville} - {hotel.prixParNuit.toLocaleString("fr-CA")} dollars/nuit - {hotel.statut}</p>
            </div>
            <div className="flex gap-2">
              <Link href={"/admin/hotels/" + hotel.id} className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">
                Modifier
              </Link>
              <Link href={"/admin/hotels/" + hotel.id + "/visite360"} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-700">
                Visite 360
              </Link>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-xl font-semibold">Salles ({salles.length})</h2>
      <div className="overflow-hidden rounded-xl bg-slate-800">
        {salles.map((salle) => (
          <div key={salle.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-4 last:border-none">
            <div>
              <p className="font-semibold">{salle.titre}</p>
              <p className="text-sm text-slate-400">{salle.localisation.ville} - {salle.prix.toLocaleString("fr-CA")} dollars - {salle.statut}</p>
            </div>
            <div className="flex gap-2">
              <Link href={"/admin/salles/" + salle.id} className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">
                Modifier
              </Link>
              <Link href={"/admin/salles/" + salle.id + "/visite360"} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-700">
                Visite 360
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}