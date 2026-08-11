"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sauvegarderSalle } from "@/lib/store";
import { fichierVersBase64 } from "@/lib/imageUtils";
import SelectPays from "@/components/SelectPays";
import { Salle, TypeEvenement } from "@/types";

const evenementsListe: { valeur: TypeEvenement; label: string }[] = [
  { valeur: "mariage", label: "Mariage" },
  { valeur: "anniversaire", label: "Anniversaire" },
  { valeur: "bal", label: "Bal" },
  { valeur: "deuil", label: "Deuil" },
  { valeur: "fete", label: "Fete" },
  { valeur: "conference", label: "Conference" },
  { valeur: "polyvalente", label: "Polyvalente (accepte tous evenements)" },
];

export default function NouvelleSallePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [evenements, setEvenements] = useState<TypeEvenement[]>([]);

  const [form, setForm] = useState({
    titre: "",
    description: "",
    prix: 0,
    statut: "disponible" as Salle["statut"],
    pays: "",
    province: "",
    ville: "",
    quartier: "",
    capacite: 50,
    superficie: 0,
    parking: false,
    climatisation: false,
    sonorisation: false,
    eclairageEvenementiel: false,
    cuisine: false,
    wifi: false,
    visiteVirtuelle: false,
    whatsapp: "",
    telephone: "",
  });

  function champ(nom: string, valeur: any) {
    setForm((prev) => ({ ...prev, [nom]: valeur }));
  }

  function toggleEvenement(ev: TypeEvenement) {
    setEvenements((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = e.target.files;
    if (!fichiers) return;
    const nouvelles: string[] = [];
    for (let i = 0; i < fichiers.length; i++) {
      nouvelles.push(await fichierVersBase64(fichiers[i]));
    }
    setPhotos((prev) => [...prev, ...nouvelles]);
  }

  function supprimerPhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nouvelleSalle: Salle = {
      id: Date.now().toString(),
      titre: form.titre,
      description: form.description,
      prix: Number(form.prix),
      statut: form.statut,
      localisation: {
        pays: form.pays,
        province: form.province,
        ville: form.ville,
        quartier: form.quartier || undefined,
      },
      capacite: Number(form.capacite),
      superficie: Number(form.superficie),
      evenementsAcceptes: evenements,
      parking: form.parking,
      climatisation: form.climatisation,
      sonorisation: form.sonorisation,
      eclairageEvenementiel: form.eclairageEvenementiel,
      cuisine: form.cuisine,
      wifi: form.wifi,
      visiteVirtuelle: form.visiteVirtuelle,
      photos: photos,
      contact: {
        whatsapp: form.whatsapp,
        telephone: form.telephone,
      },
    };

    try {
      sauvegarderSalle(nouvelleSalle);
      router.push("/admin/dashboard");
    } catch (err) {
      alert("Erreur : les photos sont trop lourdes. Essaie avec moins de photos.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">Ajouter une salle</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <Champ label="Titre">
          <input required value={form.titre} onChange={(e) => champ("titre", e.target.value)} className="input" />
        </Champ>

        <Champ label="Description">
          <textarea required value={form.description} onChange={(e) => champ("description", e.target.value)} className="input min-h-24" />
        </Champ>

        <div className="grid grid-cols-2 gap-4">
          <Champ label="Prix">
            <input required type="number" value={form.prix} onChange={(e) => champ("prix", e.target.value)} className="input" />
          </Champ>
          <Champ label="Capacite (personnes)">
            <input required type="number" value={form.capacite} onChange={(e) => champ("capacite", e.target.value)} className="input" />
          </Champ>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Champ label="Pays">
            <SelectPays value={form.pays} onChange={(v) => champ("pays", v)} className="input" />
          </Champ>
          <Champ label="Province/Etat">
            <input required value={form.province} onChange={(e) => champ("province", e.target.value)} className="input" />
          </Champ>
          <Champ label="Ville">
            <input required value={form.ville} onChange={(e) => champ("ville", e.target.value)} className="input" />
          </Champ>
        </div>

        <Champ label="Quartier (optionnel)">
          <input value={form.quartier} onChange={(e) => champ("quartier", e.target.value)} className="input" />
        </Champ>

        <Champ label="Superficie (m2)">
          <input type="number" value={form.superficie} onChange={(e) => champ("superficie", e.target.value)} className="input" />
        </Champ>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Evenements acceptes</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {evenementsListe.map((ev) => (
              <label key={ev.valeur} className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={evenements.includes(ev.valeur)}
                  onChange={() => toggleEvenement(ev.valeur)}
                />
                {ev.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Case label="Parking" checked={form.parking} onChange={(v) => champ("parking", v)} />
          <Case label="Climatisation" checked={form.climatisation} onChange={(v) => champ("climatisation", v)} />
          <Case label="Sonorisation" checked={form.sonorisation} onChange={(v) => champ("sonorisation", v)} />
          <Case label="Eclairage evenementiel" checked={form.eclairageEvenementiel} onChange={(v) => champ("eclairageEvenementiel", v)} />
          <Case label="Cuisine" checked={form.cuisine} onChange={(v) => champ("cuisine", v)} />
          <Case label="Wifi" checked={form.wifi} onChange={(v) => champ("wifi", v)} />
          <Case label="Visite virtuelle" checked={form.visiteVirtuelle} onChange={(v) => champ("visiteVirtuelle", v)} />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Photos</label>
          <input type="file" accept="image/*" multiple onChange={handlePhotos} className="input" />
          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative">
                  <img src={photo} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => supprimerPhoto(i)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Champ label="WhatsApp (avec indicatif, sans +)">
            <input required value={form.whatsapp} onChange={(e) => champ("whatsapp", e.target.value)} className="input" />
          </Champ>
          <Champ label="Telephone">
            <input required value={form.telephone} onChange={(e) => champ("telephone", e.target.value)} className="input" />
          </Champ>
        </div>

        <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
          Enregistrer la salle
        </button>
      </form>
    </main>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function Case({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}