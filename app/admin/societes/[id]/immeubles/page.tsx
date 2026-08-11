"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSocieteParId, getImmeublesParSociete, sauvegarderImmeuble, supprimerImmeuble } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";
import SelectPays from "@/components/SelectPays";
import { Immeuble } from "@/types";

export default function ImmeublesAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: societeId } = use(params);
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [nomSociete, setNomSociete] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    description: "",
    pays: "",
    province: "",
    ville: "",
    quartier: "",
  });

  useEffect(() => {
    async function charger() {
      const connecte = localStorage.getItem("admin_connecte");
      if (connecte !== "true") {
        router.push("/admin");
        return;
      }
      const societe = await getSocieteParId(societeId);
      setNomSociete(societe ? societe.nom : "Societe");
      const im = await getImmeublesParSociete(societeId);
      setImmeubles(im);
      setPret(true);
    }
    charger();
  }, [router, societeId]);

  function champ(nom: string, valeur: string) {
    setForm((prev) => ({ ...prev, [nom]: valeur }));
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = e.target.files;
    if (!fichiers) return;
    setEnCours(true);
    const nouvelles: string[] = [];
    for (let i = 0; i < fichiers.length; i++) {
      try {
        const url = await uploaderPhoto(fichiers[i]);
        nouvelles.push(url);
      } catch (err) {
        alert("Erreur lors de l'envoi d'une photo.");
      }
    }
    setPhotos((prev) => [...prev, ...nouvelles]);
    setEnCours(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nouvelImmeuble: Immeuble = {
      id: Date.now().toString(),
      societeId,
      nom: form.nom,
      description: form.description,
      localisation: {
        pays: form.pays,
        province: form.province,
        ville: form.ville,
        quartier: form.quartier || undefined,
      },
      photos,
    };
    await sauvegarderImmeuble(nouvelImmeuble);
    setImmeubles(await getImmeublesParSociete(societeId));
    setForm({ nom: "", description: "", pays: "", province: "", ville: "", quartier: "" });
    setPhotos([]);
  }

  async function handleSupprimer(id: string) {
    if (confirm("Supprimer cet immeuble ?")) {
      await supprimerImmeuble(id);
      setImmeubles(await getImmeublesParSociete(societeId));
    }
  }

  if (!pret) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/societes" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour aux societes
      </Link>

      <h1 className="mb-8 text-3xl font-bold">Immeubles de {nomSociete}</h1>

      <form onSubmit={handleSubmit} className="mb-10 max-w-xl space-y-4 rounded-xl bg-slate-800 p-6">
        <h2 className="text-xl font-semibold">Ajouter un immeuble</h2>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Nom de l'immeuble</label>
          <input required value={form.nom} onChange={(e) => champ("nom", e.target.value)} className="input" placeholder="Grace Tower" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Description</label>
          <textarea value={form.description} onChange={(e) => champ("description", e.target.value)} className="input min-h-20" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Pays</label>
            <SelectPays value={form.pays} onChange={(v) => champ("pays", v)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Province/Etat</label>
            <input required value={form.province} onChange={(e) => champ("province", e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Ville</label>
            <input required value={form.ville} onChange={(e) => champ("ville", e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Quartier (optionnel)</label>
          <input value={form.quartier} onChange={(e) => champ("quartier", e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Photos</label>
          <input type="file" accept="image/*" multiple onChange={handlePhotos} className="input" />
          {enCours && <p className="mt-2 text-sm text-blue-400">Envoi en cours...</p>}
          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <img key={i} src={photo} alt="" className="h-20 w-20 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
          Ajouter l'immeuble
        </button>
      </form>

      <h2 className="mb-4 text-xl font-semibold">Immeubles existants ({immeubles.length})</h2>
      <div className="space-y-4">
        {immeubles.map((immeuble) => (
          <div key={immeuble.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800 p-5">
            <div>
              <p className="font-semibold">{immeuble.nom}</p>
              <p className="text-sm text-slate-400">{immeuble.localisation.ville}, {immeuble.localisation.province}</p>
            </div>
            <button onClick={() => handleSupprimer(immeuble.id)} className="rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700">
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {immeubles.length === 0 && <p className="text-slate-400">Aucun immeuble ajoute pour l'instant.</p>}
    </main>
  );
}