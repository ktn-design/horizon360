"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getParametres, sauvegarderParametres } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";
import { ParametresSite } from "@/types";
import { texteErreur } from "@/lib/erreurs";

export default function ParametresPage() {
  const router = useRouter();
  const [charge, setCharge] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [form, setForm] = useState<ParametresSite>({
    nomSite: "",
    description: "",
    email: "",
    telephone: "",
    whatsapp: "",
    adresse: "",
    texteAPropos: "",
    imageAccueilUrl: "",
    imagesDiaporama: [],
    imageMaisonsUrl: "",
    imagesDiaporamaMaisons: [],
    imageHotelsUrl: "",
    imagesDiaporamaHotels: [],
    imageSallesUrl: "",
    imagesDiaporamaSalles: [],
    couleurBoutonMaisons: "#2563eb",
    couleurBoutonHotels: "#2563eb",
    couleurBoutonSalles: "#2563eb",
  });

  useEffect(() => {
    async function verifierEtCharger() {
      const p = await getParametres();
      setForm(p);
      setCharge(true);
    }
    verifierEtCharger();
  }, [router]);

  function champ(nom: string, valeur: string) {
    setForm((prev) => ({ ...prev, [nom]: valeur }));
    setEnregistre(false);
  }

  async function handleImage(nomChamp: string, e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setEnCours(true);
    try {
      const url = await uploaderPhoto(fichier);
      champ(nomChamp, url);
    } catch (err) {
      alert(texteErreur(err));
    }
    setEnCours(false);
  }

  async function handleDiaporama(nomChampDiaporama: keyof ParametresSite, e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = e.target.files;
    if (!fichiers) return;
    setEnCours(true);
    const nouvelles: string[] = [];
    for (let i = 0; i < fichiers.length; i++) {
      try {
        const url = await uploaderPhoto(fichiers[i]);
        nouvelles.push(url);
      } catch (err) {
        alert(texteErreur(err));
      }
    }
    setForm((prev) => ({
      ...prev,
      [nomChampDiaporama]: [...(prev[nomChampDiaporama] as string[]), ...nouvelles],
    }));
    setEnregistre(false);
    setEnCours(false);
  }

  function supprimerImageDiaporama(nomChampDiaporama: keyof ParametresSite, index: number) {
    setForm((prev) => ({
      ...prev,
      [nomChampDiaporama]: (prev[nomChampDiaporama] as string[]).filter((_, i) => i !== index),
    }));
    setEnregistre(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await sauvegarderParametres(form);
      setEnregistre(true);
    } catch (err) {
      alert(texteErreur(err));
    }
  }

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">Parametres du site</h1>

      {enCours && <p className="mb-4 text-blue-400">Envoi de l'image en cours...</p>}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-blue-400">Informations generales (affichees dans le pied de page)</h2>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Nom du site</label>
            <input value={form.nomSite} onChange={(e) => champ("nomSite", e.target.value)} className="input" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Slogan / description courte</label>
            <input value={form.description} onChange={(e) => champ("description", e.target.value)} className="input" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Texte "A propos"</label>
            <textarea value={form.texteAPropos} onChange={(e) => champ("texteAPropos", e.target.value)} className="input min-h-32" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Email de contact</label>
              <input value={form.email} onChange={(e) => champ("email", e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Telephone</label>
              <input value={form.telephone} onChange={(e) => champ("telephone", e.target.value)} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">WhatsApp (sans +)</label>
              <input value={form.whatsapp} onChange={(e) => champ("whatsapp", e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Adresse</label>
              <input value={form.adresse} onChange={(e) => champ("adresse", e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="space-y-5 border-t border-slate-700 pt-6">
          <h2 className="text-xl font-semibold text-blue-400">Diaporama de l'accueil</h2>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Ajouter des images</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleDiaporama("imagesDiaporama", e)} className="input" />
          </div>
          {form.imagesDiaporama.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {form.imagesDiaporama.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  <button type="button" onClick={() => supprimerImageDiaporama("imagesDiaporama", i)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">X</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 border-t border-slate-700 pt-6">
          <h2 className="text-xl font-semibold text-blue-400">Bouton / carte "Maisons"</h2>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Image du bouton Maisons</label>
            <input type="file" accept="image/*" onChange={(e) => handleImage("imageMaisonsUrl", e)} className="input" />
            {form.imageMaisonsUrl && <img src={form.imageMaisonsUrl} alt="" className="mt-3 h-32 w-full rounded-lg object-cover" />}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Couleur du bouton Maisons</label>
            <input type="color" value={form.couleurBoutonMaisons} onChange={(e) => champ("couleurBoutonMaisons", e.target.value)} className="h-12 w-24 rounded-lg" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Diaporama de fond page Maisons</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleDiaporama("imagesDiaporamaMaisons", e)} className="input" />
          </div>
          {form.imagesDiaporamaMaisons.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {form.imagesDiaporamaMaisons.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  <button type="button" onClick={() => supprimerImageDiaporama("imagesDiaporamaMaisons", i)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">X</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 border-t border-slate-700 pt-6">
          <h2 className="text-xl font-semibold text-blue-400">Bouton / carte "Hotels"</h2>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Image du bouton Hotels</label>
            <input type="file" accept="image/*" onChange={(e) => handleImage("imageHotelsUrl", e)} className="input" />
            {form.imageHotelsUrl && <img src={form.imageHotelsUrl} alt="" className="mt-3 h-32 w-full rounded-lg object-cover" />}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Couleur du bouton Hotels</label>
            <input type="color" value={form.couleurBoutonHotels} onChange={(e) => champ("couleurBoutonHotels", e.target.value)} className="h-12 w-24 rounded-lg" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Diaporama de fond page Hotels</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleDiaporama("imagesDiaporamaHotels", e)} className="input" />
          </div>
          {form.imagesDiaporamaHotels.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {form.imagesDiaporamaHotels.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  <button type="button" onClick={() => supprimerImageDiaporama("imagesDiaporamaHotels", i)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">X</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 border-t border-slate-700 pt-6">
          <h2 className="text-xl font-semibold text-blue-400">Bouton / carte "Salles"</h2>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Image du bouton Salles</label>
            <input type="file" accept="image/*" onChange={(e) => handleImage("imageSallesUrl", e)} className="input" />
            {form.imageSallesUrl && <img src={form.imageSallesUrl} alt="" className="mt-3 h-32 w-full rounded-lg object-cover" />}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Couleur du bouton Salles</label>
            <input type="color" value={form.couleurBoutonSalles} onChange={(e) => champ("couleurBoutonSalles", e.target.value)} className="h-12 w-24 rounded-lg" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Diaporama de fond page Salles</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleDiaporama("imagesDiaporamaSalles", e)} className="input" />
          </div>
          {form.imagesDiaporamaSalles.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {form.imagesDiaporamaSalles.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  <button type="button" onClick={() => supprimerImageDiaporama("imagesDiaporamaSalles", i)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">X</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
          Enregistrer les parametres
        </button>

        {enregistre && <p className="text-emerald-400">Parametres enregistres avec succes.</p>}
      </form>
    </main>
  );
}