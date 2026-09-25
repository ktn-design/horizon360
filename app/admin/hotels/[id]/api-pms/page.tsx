"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getHotelParId, getPartenaireApiParHotel, sauvegarderPartenaireApi, HotelPartenaireApi } from "@/lib/store";
import { texteErreur } from "@/lib/erreurs";

export default function ApiPmsHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: hotelId } = use(params);
  const router = useRouter();
  const [nomHotel, setNomHotel] = useState("");
  const [charge, setCharge] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  const [form, setForm] = useState({
    nomSystemePms: "",
    urlApi: "",
    cleApi: "",
    actif: false,
  });

  useEffect(() => {
    async function charger() {
      const h = await getHotelParId(hotelId);
      setNomHotel(h ? h.titre : "Hotel");
      const existant = await getPartenaireApiParHotel(hotelId);
      if (existant) {
        setForm({
          nomSystemePms: existant.nomSystemePms,
          urlApi: existant.urlApi,
          cleApi: existant.cleApi,
          actif: existant.actif,
        });
      }
      setCharge(true);
    }
    charger();
  }, [hotelId, router]);

  function champ(nom: string, valeur: any) {
    setForm((prev) => ({ ...prev, [nom]: valeur }));
    setEnregistre(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);

    const partenaire: HotelPartenaireApi = {
      id: hotelId,
      hotelId,
      nomSystemePms: form.nomSystemePms,
      urlApi: form.urlApi,
      cleApi: form.cleApi,
      actif: form.actif,
    };

    try {
      await sauvegarderPartenaireApi(partenaire);
      setEnregistre(true);
    } catch (err) {
      alert(texteErreur(err));
    }
    setEnCours(false);
  }

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href={"/admin/hotels/" + hotelId} className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour a la fiche de l'hotel
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Connexion API partenaire (PMS)</h1>
      <p className="mb-8 text-slate-400">
        {nomHotel} — configure ici les acces au systeme de gestion hoteliere (PMS) de cet hotel partenaire.
        Ces informations serviront plus tard a synchroniser automatiquement les disponibilites et les reservations.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Systeme PMS</label>
          <input
            value={form.nomSystemePms}
            onChange={(e) => champ("nomSystemePms", e.target.value)}
            className="input"
            placeholder="Ex: Cloudbeds, Mews, Opera"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">URL de l'API</label>
          <input
            value={form.urlApi}
            onChange={(e) => champ("urlApi", e.target.value)}
            className="input"
            placeholder="https://api.exemple-pms.com/v1"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Cle API</label>
          <input
            value={form.cleApi}
            onChange={(e) => champ("cleApi", e.target.value)}
            className="input"
            type="password"
            placeholder="Cle secrete fournie par le partenaire"
          />
        </div>

        <label className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm">
          <input type="checkbox" checked={form.actif} onChange={(e) => champ("actif", e.target.checked)} />
          Connexion active
        </label>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={enCours} className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-70">
            {enCours ? "Enregistrement..." : "Enregistrer"}
          </button>
          {enregistre && <p className="text-sm text-emerald-400">Enregistre.</p>}
        </div>
      </form>
    </main>
  );
}
