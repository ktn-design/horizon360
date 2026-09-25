"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMaisons, getHotels, getSalles } from "@/lib/store";
import { Maison, Hotel, Salle } from "@/types";
import { useProfilAdmin } from "@/components/GardeAdmin";
import { aPermission } from "@/lib/permissions";

export default function DashboardPage() {
  const profil = useProfilAdmin();
  const estPrincipal = profil.role === "principal";
  const voitMaisons = aPermission(profil, "maisons");
  const voitHotels = aPermission(profil, "hotels");
  const voitChambres = aPermission(profil, "chambres");
  const voitSalles = aPermission(profil, "salles");

  const [pret, setPret] = useState(false);
  const [refus, setRefus] = useState(false);
  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);

  useEffect(() => {
    // Arrivee apres une tentative d'ouvrir une section non attribuee (proxy.ts / GardeAdmin).
    setRefus(new URLSearchParams(window.location.search).get("refus") === "1");

    async function charger() {
      const [m, h, s] = await Promise.all([
        voitMaisons ? getMaisons() : Promise.resolve([]),
        voitHotels || voitChambres ? getHotels() : Promise.resolve([]),
        voitSalles ? getSalles() : Promise.resolve([]),
      ]);
      setMaisons(m);
      setHotels(h);
      setSalles(s);
      setPret(true);
    }
    charger();
  }, [voitMaisons, voitHotels, voitChambres, voitSalles]);

  if (!pret) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  const aucuneSection = !voitMaisons && !voitHotels && !voitChambres && !voitSalles;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">Tableau de bord</h1>

      {refus && (
        <p role="alert" className="mb-6 rounded-lg border border-yellow-500/60 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Vous n'avez pas acces a cette section. Demandez a l'administrateur principal de vous l'attribuer.
        </p>
      )}

      {aucuneSection && (
        <p className="mb-6 rounded-lg bg-slate-800 p-4 text-sm text-slate-300">
          Aucune section ne vous est attribuee pour le moment. Contactez l'administrateur principal.
        </p>
      )}

      <div className="mb-10 flex flex-wrap gap-4">
        {voitMaisons && (
          <Link href="/admin/maisons/nouveau" className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700">
            + Ajouter une maison
          </Link>
        )}
        {voitHotels && (
          <Link href="/admin/hotels/nouveau" className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700">
            + Ajouter un hotel
          </Link>
        )}
        {voitSalles && (
          <Link href="/admin/salles/nouveau" className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700">
            + Ajouter une salle
          </Link>
        )}
        {voitMaisons && (
          <Link href="/admin/societes" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
            Societes et immeubles
          </Link>
        )}
        {estPrincipal && (
          <>
            <Link href="/admin/parametres" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
              Parametres du site
            </Link>
            <Link href="/admin/messages" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
              Messages de contact
            </Link>
            <Link href="/admin/reservations" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
              Reservations
            </Link>
            <Link href="/admin/statistiques" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
              Statistiques
            </Link>
            <Link href="/admin/administrateurs" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
              Administrateurs
            </Link>
            <Link href="/admin/journal" className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600">
              Journal des actions
            </Link>
          </>
        )}
      </div>

      {voitMaisons && (
        <>
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
        </>
      )}

      {(voitHotels || voitChambres) && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Hotels ({hotels.length})</h2>
          <div className="mb-10 overflow-hidden rounded-xl bg-slate-800">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-4 last:border-none">
                <div>
                  <p className="font-semibold">{hotel.titre}</p>
                  <p className="text-sm text-slate-400">{hotel.localisation.ville} - {hotel.statut}</p>
                </div>
                <div className="flex gap-2">
                  {voitHotels && (
                    <>
                      <Link href={"/admin/hotels/" + hotel.id} className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">
                        Modifier
                      </Link>
                      <Link href={"/admin/hotels/" + hotel.id + "/visite360"} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-700">
                        Visite 360
                      </Link>
                    </>
                  )}
                  {voitChambres && (
                    <Link href={"/admin/hotels/" + hotel.id + "/chambres"} className="rounded-lg bg-purple-600 px-3 py-2 text-sm hover:bg-purple-700">
                      Chambres
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {voitSalles && (
        <>
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
        </>
      )}
    </main>
  );
}
