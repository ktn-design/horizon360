"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getChambreParId, sauvegarderChambre, supprimerChambre, ChambreHotel } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";

export default function ModifierChambrePage({ params }: { params: Promise<{ id: string; chambreId: string }> }) {
  const { id: hotelId, chambreId } = use(params);
  const router = useRouter();
  const [charge, setCharge] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [chambreExistante, setChambreExistante] = useState<ChambreHotel | null>(null);

  const [form, setForm] = useState({
    nom: "",
    description: "",
    prixParNuit: 0,
    capacite: 2,
    statut: "disponible" as ChambreHotel["statut"],
    visiteVirtuelle: false,
  });

  useEffect(() => {
    async function charger() {
      const connecte = localStorage.getItem("admin_connecte");
      if (connecte !== "true") {
        router.push("/admin");
        return;
      }
      const c = await getChambreParId(chambreId);
      if (c) {
        setChambreExistante(c);
        setForm({
          nom: c.nom,
          description: c.description,
          prixParNuit: c.prixParNuit,
          capacite: c.capacite,
          statut: c.statut,
          visiteVirtuelle: c.visiteVirtuelle,
        });
        setPhotos(c.photos || []);
      }
      setCharge(true);
    }
    charger();
  }, [chambreId, router]);

  function champ(nom: string, valeur: any) {
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

  function supprimerPhotoLocale(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const chambreMaj: ChambreHotel = {
      id: chambreId,
      hotelId,
      nom: form.nom,
      description: form.description,
      prixParNuit: Number(form.prixParNuit),
      capacite: Number(form.capacite),
      statut: form.statut,
      photos,
      visiteVirtuelle: form.visiteVirtuelle,
      panorama360Url: chambreExistante?.panorama360Url,
      panoramas: chambreExistante?.panoramas,
    };

    try {
      await sauvegarderChambre(chambreMaj);
      router.push("/admin/hotels/" + hotelId + "/chambres");
    } catch (err) {
      alert("Erreur lors de l'enregistrement.");
    }
  }

  async function handleSupprimer() {
    if (confirm("Supprimer cette chambre definitivement ?")) {
      await supprimerChambre(chambreId);
      router.push("/admin/hotels/" + hotelId + "/chambres");
    }
  }

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href={"/admin/hotels/" + hotelId + "/chambres"} className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour aux chambres
      </Link>

      <h1 className="mb-8 text-3xl font-bold">Modifier la chambre</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Nom de la chambre</label>
          <input required value={form.nom} onChange={(e) => champ("nom", e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Description</label>
          <textarea required value={form.description} onChange={(e) => champ("description", e.target.value)} className="input min-h-24" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Prix par nuit</label>
            <input required type="number" value={form.prixParNuit} onChange={(e) => champ("prixParNuit", e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Capacite (personnes)</label>
            <input required type="number" value={form.capacite} onChange={(e) => champ("capacite", e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Statut</label>
          <select value={form.statut} onChange={(e) => champ("statut", e.target.value)} className="input">
            <option value="disponible">Disponible</option>
            <option value="loue">Loue</option>
            <option value="indisponible">Indisponible</option>
          </select>
        </div>

        <label className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm">
          <input type="checkbox" checked={form.visiteVirtuelle} onChange={(e) => champ("visiteVirtuelle", e.target.checked)} />
          Visite virtuelle disponible
        </label>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Photos</label>
          <input type="file" accept="image/*" multiple onChange={handlePhotos} className="input" />
          {enCours && <p className="mt-2 text-sm text-blue-400">Envoi des photos en cours...</p>}
          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative">
                  <img src={photo} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => supprimerPhotoLocale(i)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
            Enregistrer les modifications
          </button>
          <button type="button" onClick={handleSupprimer} className="rounded-lg bg-red-600 px-6 py-3 font-semibold hover:bg-red-700">
            Supprimer
          </button>
        </div>
      </form>
    </main>
  );
}