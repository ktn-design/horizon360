"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sauvegarderMaison, getImmeubles } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";
import SelectPays from "@/components/SelectPays";
import { Maison, Immeuble } from "@/types";

export default function NouvelleMaisonPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [immeubleId, setImmeubleId] = useState("");
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);

  useEffect(() => {
    async function charger() {
      const connecte = localStorage.getItem("admin_connecte");
      if (connecte !== "true") {
        router.push("/admin");
        return;
      }
      const im = await getImmeubles();
      setImmeubles(im);
    }
    charger();
  }, [router]);

  const [form, setForm] = useState({
    titre: "",
    description: "",
    prix: 0,
    transaction: "vente" as Maison["transaction"],
    statut: "disponible" as Maison["statut"],
    pays: "",
    province: "",
    ville: "",
    quartier: "",
    chambres: 1,
    sallesDeBain: 1,
    superficie: 0,
    parking: false,
    piscine: false,
    jardin: false,
    meublee: false,
    climatisation: false,
    internet: false,
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
    const nouvellesPhotos: string[] = [];

    for (let i = 0; i < fichiers.length; i++) {
      try {
        const url = await uploaderPhoto(fichiers[i]);
        nouvellesPhotos.push(url);
      } catch (err) {
        alert("Erreur lors de l'envoi d'une photo.");
      }
    }

    setPhotos((prev) => [...prev, ...nouvellesPhotos]);
    setEnCours(false);
  }

  function supprimerPhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nouvelleMaison: Maison = {
      id: Date.now().toString(),
      titre: form.titre,
      description: form.description,
      prix: Number(form.prix),
      transaction: form.transaction,
      statut: form.statut,
      localisation: {
        pays: form.pays,
        province: form.province,
        ville: form.ville,
        quartier: form.quartier || undefined,
      },
      chambres: Number(form.chambres),
      sallesDeBain: Number(form.sallesDeBain),
      superficie: Number(form.superficie),
      parking: form.parking,
      piscine: form.piscine,
      jardin: form.jardin,
      meublee: form.meublee,
      climatisation: form.climatisation,
      internet: form.internet,
      visiteVirtuelle: form.visiteVirtuelle,
      immeubleId: immeubleId || undefined,
      photos: photos,
      contact: {
        whatsapp: form.whatsapp,
        telephone: form.telephone,
      },
    };

    try {
      await sauvegarderMaison(nouvelleMaison);
      router.push("/admin/dashboard");
    } catch (err) {
      alert("Erreur lors de l'enregistrement.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">Ajouter une maison</h1>

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
          <Champ label="Type de transaction">
            <select value={form.transaction} onChange={(e) => champ("transaction", e.target.value)} className="input">
              <option value="vente">A vendre</option>
              <option value="location">A louer</option>
              <option value="location_courte_duree">Courte duree</option>
            </select>
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

        <div className="grid grid-cols-3 gap-4">
          <Champ label="Chambres">
            <input type="number" value={form.chambres} onChange={(e) => champ("chambres", e.target.value)} className="input" />
          </Champ>
          <Champ label="Salles de bain">
            <input type="number" value={form.sallesDeBain} onChange={(e) => champ("sallesDeBain", e.target.value)} className="input" />
          </Champ>
          <Champ label="Superficie (m2)">
            <input type="number" value={form.superficie} onChange={(e) => champ("superficie", e.target.value)} className="input" />
          </Champ>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Case label="Parking" checked={form.parking} onChange={(v) => champ("parking", v)} />
          <Case label="Piscine" checked={form.piscine} onChange={(v) => champ("piscine", v)} />
          <Case label="Jardin" checked={form.jardin} onChange={(v) => champ("jardin", v)} />
          <Case label="Meublee" checked={form.meublee} onChange={(v) => champ("meublee", v)} />
          <Case label="Climatisation" checked={form.climatisation} onChange={(v) => champ("climatisation", v)} />
          <Case label="Internet" checked={form.internet} onChange={(v) => champ("internet", v)} />
          <Case label="Visite virtuelle" checked={form.visiteVirtuelle} onChange={(v) => champ("visiteVirtuelle", v)} />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Immeuble (optionnel)</label>
          <select value={immeubleId} onChange={(e) => setImmeubleId(e.target.value)} className="input">
            <option value="">Aucun (maison independante)</option>
            {immeubles.map((im) => (
              <option key={im.id} value={im.id}>{im.nom}</option>
            ))}
          </select>
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

        <div className="grid grid-cols-2 gap-4">
          <Champ label="WhatsApp (avec indicatif, sans +)">
            <input required value={form.whatsapp} onChange={(e) => champ("whatsapp", e.target.value)} className="input" placeholder="15145550123" />
          </Champ>
          <Champ label="Telephone">
            <input required value={form.telephone} onChange={(e) => champ("telephone", e.target.value)} className="input" placeholder="+15145550123" />
          </Champ>
        </div>

        <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
          Enregistrer la maison
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