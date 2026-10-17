"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getImmeubleParId, getMaisonsParImmeuble, sauvegarderImmeuble } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";
import SelectPays from "@/components/SelectPays";
import EditeurMaquette3D from "@/components/EditeurMaquette3D";
import EditeurReperesMaquette from "@/components/EditeurReperesMaquette";
import { Immeuble, RepereMaquette } from "@/types";
import { texteErreur } from "@/lib/erreurs";

export default function ModifierImmeublePage({ params }: { params: Promise<{ id: string; immeubleId: string }> }) {
  const { id: societeId, immeubleId } = use(params);
  const router = useRouter();
  const [immeuble, setImmeuble] = useState<Immeuble | null>(null);
  const [appartements, setAppartements] = useState<{ id: string; titre: string }[]>([]);
  const [form, setForm] = useState({ nom: "", description: "", pays: "", province: "", ville: "", quartier: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const [maquette3dUrl, setMaquette3dUrl] = useState<string | undefined>(undefined);
  const [reperes, setReperes] = useState<RepereMaquette[] | undefined>(undefined);
  const [envoiPhotos, setEnvoiPhotos] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [introuvable, setIntrouvable] = useState(false);

  useEffect(() => {
    async function charger() {
      const [im, apparts] = await Promise.all([getImmeubleParId(immeubleId), getMaisonsParImmeuble(immeubleId)]);
      if (!im) {
        setIntrouvable(true);
        return;
      }
      setImmeuble(im);
      setForm({
        nom: im.nom,
        description: im.description,
        pays: im.localisation.pays,
        province: im.localisation.province,
        ville: im.localisation.ville,
        quartier: im.localisation.quartier || "",
      });
      setPhotos(im.photos);
      setMaquette3dUrl(im.maquette3dUrl);
      setReperes(im.reperesMaquette);
      setAppartements(apparts.map((m) => ({ id: m.id, titre: m.titre })));
    }
    charger();
  }, [immeubleId]);

  function champ(nom: string, valeur: string) {
    setForm((prev) => ({ ...prev, [nom]: valeur }));
  }

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = e.target.files;
    if (!fichiers) return;
    setEnvoiPhotos(true);
    setErreur("");
    const nouvelles: string[] = [];
    const echecs: string[] = [];
    for (const fichier of Array.from(fichiers)) {
      try {
        nouvelles.push(await uploaderPhoto(fichier));
      } catch (err) {
        echecs.push(texteErreur(err));
      }
    }
    setPhotos((prev) => [...prev, ...nouvelles]);
    if (echecs.length) setErreur(echecs.join("\n"));
    setEnvoiPhotos(false);
    e.target.value = "";
  }

  function definirAccueil(index: number) {
    setPhotos((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!immeuble) return;
    setErreur("");
    setEnregistrement(true);
    try {
      await sauvegarderImmeuble({
        ...immeuble,
        nom: form.nom.trim(),
        description: form.description,
        localisation: { pays: form.pays, province: form.province, ville: form.ville, quartier: form.quartier || undefined },
        photos,
        maquette3dUrl,
        // Maquette retiree : ses reperes n'ont plus de sens.
        reperesMaquette: maquette3dUrl === "" ? [] : reperes,
      });
      router.push("/admin/societes/" + societeId + "/immeubles");
    } catch (err) {
      setErreur(texteErreur(err));
      setEnregistrement(false);
    }
  }

  if (introuvable) {
    return (
      <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
        <p className="mb-4">Immeuble introuvable.</p>
        <Link href={"/admin/societes/" + societeId + "/immeubles"} className="text-blue-400">Retour aux immeubles</Link>
      </main>
    );
  }
  if (!immeuble) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href={"/admin/societes/" + societeId + "/immeubles"} className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour aux immeubles
      </Link>
      <h1 className="mb-8 text-3xl font-bold">Modifier {immeuble.nom}</h1>

      <form onSubmit={enregistrer} className="max-w-4xl space-y-6">
        <div className="space-y-4 rounded-xl bg-slate-800 p-6">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Nom de l&apos;immeuble</label>
            <input required value={form.nom} onChange={(e) => champ("nom", e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Description</label>
            <textarea value={form.description} onChange={(e) => champ("description", e.target.value)} className="input min-h-28" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        </div>

        <div className="rounded-xl bg-slate-800 p-6">
          <h3 className="text-lg font-semibold">Photos</h3>
          <p className="mb-4 text-sm text-slate-400">La premiere photo est la photo d&apos;accueil de l&apos;immeuble (page de la societe et en-tete).</p>
          <input type="file" accept="image/*" multiple onChange={ajouterPhotos} className="input" />
          {envoiPhotos && <p className="mt-2 text-sm text-blue-400">Envoi en cours...</p>}
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((photo, i) => (
                <div key={photo} className={(i === 0 ? "ring-2 ring-emerald-500 " : "") + "overflow-hidden rounded-lg bg-slate-700"}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="aspect-video w-full object-cover" />
                  <div className="flex flex-wrap gap-1 p-2 text-xs">
                    {i === 0 ? (
                      <span className="rounded bg-emerald-600 px-2 py-1 font-semibold">Photo d&apos;accueil</span>
                    ) : (
                      <button type="button" onClick={() => definirAccueil(i)} className="rounded bg-slate-600 px-2 py-1 hover:bg-slate-500">
                        Photo d&apos;accueil
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="rounded bg-red-600 px-2 py-1 hover:bg-red-700"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <EditeurMaquette3D url={maquette3dUrl} onChange={setMaquette3dUrl} />

        {maquette3dUrl && (
          <EditeurReperesMaquette url={maquette3dUrl} reperes={reperes || []} appartements={appartements} onChange={setReperes} />
        )}

        {erreur && (
          <p role="alert" className="whitespace-pre-line rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-300">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={envoiPhotos || enregistrement}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {enregistrement ? "Enregistrement..." : "Enregistrer l'immeuble"}
        </button>
      </form>
    </main>
  );
}
