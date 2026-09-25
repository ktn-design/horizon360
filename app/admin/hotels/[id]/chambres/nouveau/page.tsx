"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getHotelParId, sauvegarderChambre, ChambreHotel, TypeLit } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";
import { texteErreur } from "@/lib/erreurs";
import EditeurExtras from "@/components/EditeurExtras";
import { Extra } from "@/types";

export default function NouvelleChambrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: hotelId } = use(params);
  const router = useRouter();
  const [nomHotel, setNomHotel] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [erreur, setErreur] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    description: "",
    prixParNuit: 0,
    capacite: 2,
    statut: "disponible" as ChambreHotel["statut"],
    visiteVirtuelle: false,
    typeLit: "" as TypeLit,
    estSuite: false,
    sallesDeBain: 1,
    climatisation: false,
  });

  useEffect(() => {
    async function charger() {
      const h = await getHotelParId(hotelId);
      setNomHotel(h ? h.titre : "Hotel");
    }
    charger();
  }, [hotelId, router]);

  function champ(nom: string, valeur: any) {
    setForm((prev) => ({ ...prev, [nom]: valeur }));
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = e.target.files;
    if (!fichiers) return;
    setEnCours(true);
    setErreur("");
    const nouvelles: string[] = [];
    const echecs: string[] = [];
    for (let i = 0; i < fichiers.length; i++) {
      try {
        const url = await uploaderPhoto(fichiers[i]);
        nouvelles.push(url);
      } catch (err) {
        echecs.push(texteErreur(err));
      }
    }
    setPhotos((prev) => [...prev, ...nouvelles]);
    if (echecs.length > 0) setErreur(echecs.join("\n"));
    setEnCours(false);
    e.target.value = "";
  }

  function supprimerPhotoLocale(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    const probleme = verifierFormulaire();
    if (probleme) {
      setErreur(probleme);
      return;
    }

    const nouvelleChambre: ChambreHotel = {
      id: Date.now().toString(),
      hotelId,
      nom: form.nom,
      description: form.description,
      prixParNuit: Number(form.prixParNuit),
      capacite: Number(form.capacite),
      statut: form.statut,
      photos,
      visiteVirtuelle: form.visiteVirtuelle,
      typeLit: form.typeLit,
      estSuite: form.estSuite,
      sallesDeBain: Number(form.sallesDeBain),
      climatisation: form.climatisation,
      extras: extras.map((x) => ({ ...x, nom: x.nom.trim(), prix: Number(x.prix) || 0 })).filter((x) => x.nom !== ""),
    };

    setEnregistrement(true);
    try {
      await sauvegarderChambre(nouvelleChambre);
      router.push("/admin/dashboard");
    } catch (err) {
      setErreur(texteErreur(err));
      setEnregistrement(false);
    }
  }

  // Controles avant envoi, avec un message precis pour chaque probleme.
  function verifierFormulaire(): string {
    if (enCours) return "Patientez : les photos sont encore en cours d'envoi.";
    if (!form.nom.trim()) return "Indiquez le nom de la chambre.";
    if (!form.description.trim()) return "Indiquez une description.";
    if (!(Number(form.prixParNuit) > 0)) return "Le prix par nuit doit etre superieur a 0.";
    if (!(Number(form.capacite) >= 1)) return "La capacite doit etre d'au moins 1 personne.";
    if (!(Number(form.sallesDeBain) >= 0)) return "Le nombre de salles de bain ne peut pas etre negatif.";
    if (photos.length === 0) return "Ajoutez au moins une photo de la chambre.";
    const sansNom = extras.some((x) => x.prix > 0 && !x.nom.trim());
    if (sansNom) return "Une option a un prix mais pas de nom : donnez-lui un nom ou supprimez-la.";
    if (extras.some((x) => Number(x.prix) < 0)) return "Le prix d'une option ne peut pas etre negatif.";
    return "";
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-8 text-3xl font-bold">Ajouter une chambre a {nomHotel}</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div>
          <label className="mb-1 block text-sm text-slate-300">Nom de la chambre</label>
          <input required value={form.nom} onChange={(e) => champ("nom", e.target.value)} className="input" placeholder="Chambre Deluxe" />
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Type de lit</label>
            <select value={form.typeLit} onChange={(e) => champ("typeLit", e.target.value)} className="input">
              <option value="">Non specifie</option>
              <option value="queen">Queen size</option>
              <option value="king">King size</option>
              <option value="jumeaux">Lits jumeaux</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Salles de bain</label>
            <input required type="number" min="0" value={form.sallesDeBain} onChange={(e) => champ("sallesDeBain", e.target.value)} className="input" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm">
            <input type="checkbox" checked={form.estSuite} onChange={(e) => champ("estSuite", e.target.checked)} />
            Suite
          </label>
          <label className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm">
            <input type="checkbox" checked={form.climatisation} onChange={(e) => champ("climatisation", e.target.checked)} />
            Climatisation
          </label>
          <label className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm">
            <input type="checkbox" checked={form.visiteVirtuelle} onChange={(e) => champ("visiteVirtuelle", e.target.checked)} />
            Visite virtuelle disponible
          </label>
        </div>

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

        <EditeurExtras type="chambre" extras={extras} onChange={setExtras} />

        {erreur && (
          <p role="alert" className="whitespace-pre-line rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-300">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={enCours || enregistrement}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Enregistrer la chambre
        </button>
      </form>
    </main>
  );
}