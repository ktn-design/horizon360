"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSocietes, sauvegarderSociete, supprimerSociete } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";
import { Societe } from "@/types";
import { texteErreur } from "@/lib/erreurs";

export default function SocietesAdminPage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [societes, setSocietes] = useState<Societe[]>([]);
  const [form, setForm] = useState({ nom: "", description: "", whatsapp: "", telephone: "" });
  const [logoUrl, setLogoUrl] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    async function charger() {
      const s = await getSocietes();
      setSocietes(s);
      setPret(true);
    }
    charger();
  }, [router]);

  function champ(nom: string, valeur: string) {
    setForm((prev) => ({ ...prev, [nom]: valeur }));
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setEnCours(true);
    try {
      const url = await uploaderPhoto(fichier);
      setLogoUrl(url);
    } catch (err) {
      alert(texteErreur(err));
    }
    setEnCours(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nouvelleSociete: Societe = {
      id: Date.now().toString(),
      nom: form.nom,
      description: form.description,
      logoUrl: logoUrl,
      whatsapp: form.whatsapp,
      telephone: form.telephone,
    };
    await sauvegarderSociete(nouvelleSociete);
    setSocietes(await getSocietes());
    setForm({ nom: "", description: "", whatsapp: "", telephone: "" });
    setLogoUrl("");
  }

  async function handleSupprimer(id: string) {
    if (confirm("Supprimer cette societe ? Les immeubles lies resteront mais ne seront plus rattaches.")) {
      await supprimerSociete(id);
      setSocietes(await getSocietes());
    }
  }

  if (!pret) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-8 text-3xl font-bold">Societes immobilieres</h1>

      <form onSubmit={handleSubmit} className="mb-10 max-w-xl space-y-4 rounded-xl bg-slate-800 p-6">
        <h2 className="text-xl font-semibold">Ajouter une societe</h2>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Nom de la societe</label>
          <input required value={form.nom} onChange={(e) => champ("nom", e.target.value)} className="input" placeholder="Majengo Service" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Description</label>
          <textarea value={form.description} onChange={(e) => champ("description", e.target.value)} className="input min-h-20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">WhatsApp (sans +)</label>
            <input value={form.whatsapp} onChange={(e) => champ("whatsapp", e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Telephone</label>
            <input value={form.telephone} onChange={(e) => champ("telephone", e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Logo</label>
          <input type="file" accept="image/*" onChange={handleLogo} className="input" />
          {enCours && <p className="mt-2 text-sm text-blue-400">Envoi en cours...</p>}
          {logoUrl && <img src={logoUrl} alt="" className="mt-3 h-20 w-20 rounded-lg object-cover" />}
        </div>

        <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
          Ajouter la societe
        </button>
      </form>

      <h2 className="mb-4 text-xl font-semibold">Societes existantes ({societes.length})</h2>
      <div className="space-y-4">
        {societes.map((societe) => (
          <div key={societe.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800 p-5">
            <div className="flex items-center gap-4">
              {societe.logoUrl && <img src={societe.logoUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />}
              <div>
                <p className="font-semibold">{societe.nom}</p>
                <p className="text-sm text-slate-400">{societe.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={"/admin/societes/" + societe.id + "/immeubles"} className="rounded-lg bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700">
                Gerer les immeubles
              </Link>
              <button onClick={() => handleSupprimer(societe.id)} className="rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {societes.length === 0 && <p className="text-slate-400">Aucune societe ajoutee pour l'instant.</p>}
    </main>
  );
}