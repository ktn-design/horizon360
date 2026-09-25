"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getHotelParId, sauvegarderHotel, supprimerHotel } from "@/lib/store";
import { uploaderPhoto } from "@/lib/imageUtils";
import { Hotel } from "@/types";
import { texteErreur } from "@/lib/erreurs";

export default function ModifierHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [charge, setCharge] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [hotelExistant, setHotelExistant] = useState<Hotel | null>(null);

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

  useEffect(() => {
    async function charger() {
      const hotel = await getHotelParId(id);
      if (hotel) {
        setHotelExistant(hotel);
        setForm({
          titre: hotel.titre,
          description: hotel.description,
          prixParNuit: hotel.prixParNuit,
          statut: hotel.statut,
          pays: hotel.localisation.pays,
          province: hotel.localisation.province,
          ville: hotel.localisation.ville,
          etoiles: hotel.etoiles,
          wifi: hotel.wifi,
          parking: hotel.parking,
          piscine: hotel.piscine,
          salleDeSport: hotel.salleDeSport,
          restaurant: hotel.restaurant,
          petitDejeunerInclus: hotel.petitDejeunerInclus,
          climatisation: hotel.climatisation,
          visiteVirtuelle: hotel.visiteVirtuelle,
          whatsapp: hotel.contact.whatsapp,
          telephone: hotel.contact.telephone,
        });
        setPhotos(hotel.photos || []);
      }
      setCharge(true);
    }
    charger();
  }, [id, router]);

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
        alert(texteErreur(err));
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

    const hotelMaj: Hotel = {
      id,
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
      panorama360Url: hotelExistant?.panorama360Url,
      panoramas: hotelExistant?.panoramas,
      // Les options (petit-dejeuner, piscine, kayak...) se reglent sur chaque chambre.
      extras: hotelExistant?.extras || [],
      contact: {
        whatsapp: form.whatsapp,
        telephone: form.telephone,
      },
    };

    try {
      await sauvegarderHotel(hotelMaj);
      router.push("/admin/dashboard");
    } catch (err) {
      alert(texteErreur(err));
    }
  }

  async function handleSupprimer() {
    if (confirm("Supprimer cet hotel definitivement ?")) {
      try {
        await supprimerHotel(id);
        router.push("/admin/dashboard");
      } catch (err) {
        alert(texteErreur(err));
      }
    }
  }

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <h1 className="mb-8 text-3xl font-bold">Modifier l'hotel</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <Champ label="Titre">
          <input required value={form.titre} onChange={(e) => champ("titre", e.target.value)} className="input" />
        </Champ>

        <Champ label="Description">
          <textarea required value={form.description} onChange={(e) => champ("description", e.target.value)} className="input min-h-24" />
        </Champ>

        <div className="grid grid-cols-2 gap-4">
          <Champ label="Etoiles (1 a 5)">
            <input required type="number" min="1" max="5" value={form.etoiles} onChange={(e) => champ("etoiles", e.target.value)} className="input" />
          </Champ>
        </div>
        <p className="text-sm text-slate-400">
          Les prix et les options (petit-dejeuner, piscine, spa, kayak...) se reglent sur chaque chambre, via le bouton « Chambres » du tableau de bord.
        </p>

        <Champ label="Statut">
          <select value={form.statut} onChange={(e) => champ("statut", e.target.value)} className="input">
            <option value="disponible">Disponible</option>
            <option value="loue">Loue</option>
            <option value="vendu">Vendu</option>
            <option value="indisponible">Indisponible</option>
          </select>
        </Champ>

        <div className="grid grid-cols-3 gap-4">
          <Champ label="Pays">
            <input required value={form.pays} onChange={(e) => champ("pays", e.target.value)} className="input" />
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
          <Case label="Restaurant" checked={form.restaurant} onChange={(v) => champ("restaurant", v)} />
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

        <div className="grid grid-cols-2 gap-4">
          <Champ label="WhatsApp (avec indicatif, sans +)">
            <input required value={form.whatsapp} onChange={(e) => champ("whatsapp", e.target.value)} className="input" />
          </Champ>
          <Champ label="Telephone">
            <input required value={form.telephone} onChange={(e) => champ("telephone", e.target.value)} className="input" />
          </Champ>
        </div>

        <div className="flex flex-wrap gap-4">
          <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
            Enregistrer les modifications
          </button>
          <Link href={"/admin/hotels/" + id + "/api-pms"} className="rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700">
            Connexion API partenaire (PMS)
          </Link>
          <button type="button" onClick={handleSupprimer} className="rounded-lg bg-red-600 px-6 py-3 font-semibold hover:bg-red-700">
            Supprimer
          </button>
        </div>
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