"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sauvegarderHotel } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";
import SelectPays from "@/components/SelectPays";
import { Extra, Hotel } from "@/types";
import EditeurExtras from "@/components/EditeurExtras";

export default function NouvelHotelPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [enCours, setEnCours] = useState(false);

  const [form, setForm] = useState({
    titre: "",
    description: "",
    prixParNuit: 0,
    statut: "disponible" as Hotel["statut"],
    pays: "",
    province: "",
    ville: "",
    etoiles: 3,
    wifi: false,
    parking: false,
    piscine: false,
    salleDeSport: false,
    restaurant: false,
    petitDejeunerInclus: false,
    climatisation: false,
    visiteVirtuelle: false,
    whatsapp: "",
    telephone: "",
  });

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

  function supprimerPhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nouvelHotel: Hotel = {
      id: Date.now().toString(),
      titre: form.titre,
      description: form.description,
      prixParNuit: Number(form.prixParNuit),
      statut: form.statut,
      localisation: {
        pays: form.pays,
        province: form.province,
        ville: form.ville,
      },
      etoiles: Number(form.etoiles),
      wifi: form.wifi,
      parking: form.parking,
      piscine: form.piscine,
      salleDeSport: form.salleDeSport,
      restaurant: form.restaurant,
      petitDejeunerInclus: form.petitDejeunerInclus,
      climatisation: form.climatisation,
      visiteVirtuelle: form.visiteVirtuelle,
      photos: photos,
      extras: extras.filter((e) => e.nom.trim() !== ""),
      contact: {
        whatsapp: form.whatsapp,
        telephone: form.telephone,
      },
    };

    try {
      await sauvegarderHotel(nouvelHotel);
      router.push("/admin/dashboard");
    } catch (err) {
      alert("Erreur lors de l'enregistrement.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">Ajouter un hotel</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <Champ label="Titre">
          <input required value={form.titre} onChange={(e) => champ("titre", e.target.value)} className="input" />
        </Champ>

        <Champ label="Description">
          <textarea required value={form.description} onChange={(e) => champ("description", e.target.value)} className="input min-h-24" />
        </Champ>

        <div className="grid grid-cols-2 gap-4">
          <Champ label="Prix par nuit">
            <input required type="number" value={form.prixParNuit} onChange={(e) => champ("prixParNuit", e.target.value)} className="input" />
          </Champ>
          <Champ label="Etoiles (1 a 5)">
            <input required type="number" min="1" max="5" value={form.etoiles} onChange={(e) => champ("etoiles", e.target.value)} className="input" />
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

        <div className="grid grid-cols-3 gap-3">
          <Case label="Wifi" checked={form.wifi} onChange={(v) => champ("wifi", v)} />
          <Case label="Parking" checked={form.parking} onChange={(v) => champ("parking", v)} />
          <Case label="Piscine" checked={form.piscine} onChange={(v) => champ("piscine", v)} />
          <Case label="Salle de sport" checked={form.salleDeSport} onChange={(v) => champ("salleDeSport", v)} />
          <Case label="Restaurant" checked={form.restaurant} onChange={(v) => champ("restaurant", v)} />
          <Case label="Petit-dejeuner inclus" checked={form.petitDejeunerInclus} onChange={(v) => champ("petitDejeunerInclus", v)} />
          <Case label="Climatisation" checked={form.climatisation} onChange={(v) => champ("climatisation", v)} />
          <Case label="Visite virtuelle" checked={form.visiteVirtuelle} onChange={(v) => champ("visiteVirtuelle", v)} />
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

        <EditeurExtras type="hotel" extras={extras} onChange={setExtras} />

        <div className="grid grid-cols-2 gap-4">
          <Champ label="WhatsApp (avec indicatif, sans +)">
            <input required value={form.whatsapp} onChange={(e) => champ("whatsapp", e.target.value)} className="input" placeholder="15145550123" />
          </Champ>
          <Champ label="Telephone">
            <input required value={form.telephone} onChange={(e) => champ("telephone", e.target.value)} className="input" placeholder="+15145550123" />
          </Champ>
        </div>

        <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
          Enregistrer l'hotel
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