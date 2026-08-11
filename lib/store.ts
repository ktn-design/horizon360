import { supabase } from "./supabase";
import { Maison, Hotel, Salle, ParametresSite, Societe, Immeuble } from "@/types";

function maisonVersDb(m: Maison) {
  return {
    id: m.id,
    titre: m.titre,
    description: m.description,
    prix: m.prix,
    transaction: m.transaction,
    statut: m.statut,
    pays: m.localisation.pays,
    province: m.localisation.province,
    ville: m.localisation.ville,
    quartier: m.localisation.quartier || null,
    chambres: m.chambres,
    salles_de_bain: m.sallesDeBain,
    superficie: m.superficie,
    parking: m.parking,
    piscine: m.piscine,
    jardin: m.jardin,
    meublee: m.meublee,
    climatisation: m.climatisation,
    internet: m.internet,
    visite_virtuelle: m.visiteVirtuelle,
    immeuble_id: m.immeubleId || null,
    photos: m.photos,
    panorama_360_url: m.panorama360Url || null,
    panoramas: m.panoramas || [],
    whatsapp: m.contact.whatsapp,
    telephone: m.contact.telephone,
  };
}

function dbVersMaison(d: any): Maison {
  return {
    id: d.id,
    titre: d.titre,
    description: d.description,
    prix: Number(d.prix),
    transaction: d.transaction,
    statut: d.statut,
    localisation: { pays: d.pays, province: d.province, ville: d.ville, quartier: d.quartier || undefined },
    chambres: d.chambres,
    sallesDeBain: d.salles_de_bain,
    superficie: Number(d.superficie),
    parking: d.parking,
    piscine: d.piscine,
    jardin: d.jardin,
    meublee: d.meublee,
    climatisation: d.climatisation,
    internet: d.internet,
    visiteVirtuelle: d.visite_virtuelle,
    immeubleId: d.immeuble_id || undefined,
    photos: d.photos || [],
    panorama360Url: d.panorama_360_url || undefined,
    panoramas: d.panoramas || [],
    contact: { whatsapp: d.whatsapp, telephone: d.telephone },
  };
}

export async function getMaisons(): Promise<Maison[]> {
  const { data, error } = await supabase.from("maisons").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(dbVersMaison);
}

export async function getMaisonParId(id: string): Promise<Maison | undefined> {
  const { data, error } = await supabase.from("maisons").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return dbVersMaison(data);
}

export async function sauvegarderMaison(maison: Maison) {
  const { error } = await supabase.from("maisons").upsert(maisonVersDb(maison));
  if (error) throw new Error(error.message);
}

export async function supprimerMaison(id: string) {
  await supabase.from("maisons").delete().eq("id", id);
}

export async function getMaisonsParImmeuble(immeubleId: string): Promise<Maison[]> {
  const { data, error } = await supabase.from("maisons").select("*").eq("immeuble_id", immeubleId);
  if (error || !data) return [];
  return data.map(dbVersMaison);
}

function hotelVersDb(h: Hotel) {
  return {
    id: h.id,
    titre: h.titre,
    description: h.description,
    prix_par_nuit: h.prixParNuit,
    statut: h.statut,
    pays: h.localisation.pays,
    province: h.localisation.province,
    ville: h.localisation.ville,
    quartier: h.localisation.quartier || null,
    etoiles: h.etoiles,
    wifi: h.wifi,
    parking: h.parking,
    piscine: h.piscine,
    salle_de_sport: h.salleDeSport,
    restaurant: h.restaurant,
    petit_dejeuner_inclus: h.petitDejeunerInclus,
    climatisation: h.climatisation,
    visite_virtuelle: h.visiteVirtuelle,
    photos: h.photos,
    panorama_360_url: h.panorama360Url || null,
    panoramas: h.panoramas || [],
    whatsapp: h.contact.whatsapp,
    telephone: h.contact.telephone,
  };
}

function dbVersHotel(d: any): Hotel {
  return {
    id: d.id,
    titre: d.titre,
    description: d.description,
    prixParNuit: Number(d.prix_par_nuit),
    statut: d.statut,
    localisation: { pays: d.pays, province: d.province, ville: d.ville, quartier: d.quartier || undefined },
    etoiles: d.etoiles,
    wifi: d.wifi,
    parking: d.parking,
    piscine: d.piscine,
    salleDeSport: d.salle_de_sport,
    restaurant: d.restaurant,
    petitDejeunerInclus: d.petit_dejeuner_inclus,
    climatisation: d.climatisation,
    visiteVirtuelle: d.visite_virtuelle,
    photos: d.photos || [],
    panorama360Url: d.panorama_360_url || undefined,
    panoramas: d.panoramas || [],
    contact: { whatsapp: d.whatsapp, telephone: d.telephone },
  };
}

export async function getHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(dbVersHotel);
}

export async function getHotelParId(id: string): Promise<Hotel | undefined> {
  const { data, error } = await supabase.from("hotels").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return dbVersHotel(data);
}

export async function sauvegarderHotel(hotel: Hotel) {
  const { error } = await supabase.from("hotels").upsert(hotelVersDb(hotel));
  if (error) throw new Error(error.message);
}

export async function supprimerHotel(id: string) {
  await supabase.from("hotels").delete().eq("id", id);
}

function salleVersDb(s: Salle) {
  return {
    id: s.id,
    titre: s.titre,
    description: s.description,
    prix: s.prix,
    statut: s.statut,
    pays: s.localisation.pays,
    province: s.localisation.province,
    ville: s.localisation.ville,
    quartier: s.localisation.quartier || null,
    capacite: s.capacite,
    superficie: s.superficie,
    evenements_acceptes: s.evenementsAcceptes,
    parking: s.parking,
    climatisation: s.climatisation,
    sonorisation: s.sonorisation,
    eclairage_evenementiel: s.eclairageEvenementiel,
    cuisine: s.cuisine,
    wifi: s.wifi,
    visite_virtuelle: s.visiteVirtuelle,
    photos: s.photos,
    panorama_360_url: s.panorama360Url || null,
    panoramas: s.panoramas || [],
    whatsapp: s.contact.whatsapp,
    telephone: s.contact.telephone,
  };
}

function dbVersSalle(d: any): Salle {
  return {
    id: d.id,
    titre: d.titre,
    description: d.description,
    prix: Number(d.prix),
    statut: d.statut,
    localisation: { pays: d.pays, province: d.province, ville: d.ville, quartier: d.quartier || undefined },
    capacite: d.capacite,
    superficie: Number(d.superficie),
    evenementsAcceptes: d.evenements_acceptes || [],
    parking: d.parking,
    climatisation: d.climatisation,
    sonorisation: d.sonorisation,
    eclairageEvenementiel: d.eclairage_evenementiel,
    cuisine: d.cuisine,
    wifi: d.wifi,
    visiteVirtuelle: d.visite_virtuelle,
    photos: d.photos || [],
    panorama360Url: d.panorama_360_url || undefined,
    panoramas: d.panoramas || [],
    contact: { whatsapp: d.whatsapp, telephone: d.telephone },
  };
}

export async function getSalles(): Promise<Salle[]> {
  const { data, error } = await supabase.from("salles").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(dbVersSalle);
}

export async function getSalleParId(id: string): Promise<Salle | undefined> {
  const { data, error } = await supabase.from("salles").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return dbVersSalle(data);
}

export async function sauvegarderSalle(salle: Salle) {
  const { error } = await supabase.from("salles").upsert(salleVersDb(salle));
  if (error) throw new Error(error.message);
}

export async function supprimerSalle(id: string) {
  await supabase.from("salles").delete().eq("id", id);
}

export async function getSocietes(): Promise<Societe[]> {
  const { data, error } = await supabase.from("societes").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id, nom: d.nom, description: d.description, logoUrl: d.logo_url || "",
    whatsapp: d.whatsapp, telephone: d.telephone,
  }));
}

export async function getSocieteParId(id: string): Promise<Societe | undefined> {
  const { data, error } = await supabase.from("societes").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return { id: data.id, nom: data.nom, description: data.description, logoUrl: data.logo_url || "", whatsapp: data.whatsapp, telephone: data.telephone };
}

export async function sauvegarderSociete(societe: Societe) {
  const { error } = await supabase.from("societes").upsert({
    id: societe.id, nom: societe.nom, description: societe.description,
    logo_url: societe.logoUrl, whatsapp: societe.whatsapp, telephone: societe.telephone,
  });
  if (error) throw new Error(error.message);
}

export async function supprimerSociete(id: string) {
  await supabase.from("societes").delete().eq("id", id);
}

export async function getImmeubles(): Promise<Immeuble[]> {
  const { data, error } = await supabase.from("immeubles").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id, societeId: d.societe_id, nom: d.nom, description: d.description,
    localisation: { pays: d.pays, province: d.province, ville: d.ville, quartier: d.quartier || undefined },
    photos: d.photos || [],
  }));
}

export async function getImmeublesParSociete(societeId: string): Promise<Immeuble[]> {
  const { data, error } = await supabase.from("immeubles").select("*").eq("societe_id", societeId);
  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id, societeId: d.societe_id, nom: d.nom, description: d.description,
    localisation: { pays: d.pays, province: d.province, ville: d.ville, quartier: d.quartier || undefined },
    photos: d.photos || [],
  }));
}

export async function getImmeubleParId(id: string): Promise<Immeuble | undefined> {
  const { data, error } = await supabase.from("immeubles").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return {
    id: data.id, societeId: data.societe_id, nom: data.nom, description: data.description,
    localisation: { pays: data.pays, province: data.province, ville: data.ville, quartier: data.quartier || undefined },
    photos: data.photos || [],
  };
}

export async function sauvegarderImmeuble(immeuble: Immeuble) {
  const { error } = await supabase.from("immeubles").upsert({
    id: immeuble.id, societe_id: immeuble.societeId, nom: immeuble.nom, description: immeuble.description,
    pays: immeuble.localisation.pays, province: immeuble.localisation.province,
    ville: immeuble.localisation.ville, quartier: immeuble.localisation.quartier || null,
    photos: immeuble.photos,
  });
  if (error) throw new Error(error.message);
}

export async function supprimerImmeuble(id: string) {
  await supabase.from("immeubles").delete().eq("id", id);
}

const parametresParDefaut: ParametresSite = {
  nomSite: "Horizon 360",
  description: "Visitez des biens a distance, en immersion totale.",
  email: "contact@horizon360.com",
  telephone: "+15145550000",
  whatsapp: "15145550000",
  adresse: "Montreal, Quebec, Canada",
  texteAPropos: "Horizon 360 est une plateforme specialisee dans les visites virtuelles immersives.",
  imageAccueilUrl: "",
  imagesDiaporama: [],
  imageMaisonsUrl: "",
  imageHotelsUrl: "",
  imageSallesUrl: "",
  couleurBoutonMaisons: "#2563eb",
  couleurBoutonHotels: "#2563eb",
  couleurBoutonSalles: "#2563eb",
};

export async function getParametres(): Promise<ParametresSite> {
  const { data, error } = await supabase.from("parametres_site").select("*").eq("id", 1).single();
  if (error || !data) return parametresParDefaut;
  return {
    nomSite: data.nom_site || parametresParDefaut.nomSite,
    description: data.description || parametresParDefaut.description,
    email: data.email || parametresParDefaut.email,
    telephone: data.telephone || parametresParDefaut.telephone,
    whatsapp: data.whatsapp || parametresParDefaut.whatsapp,
    adresse: data.adresse || parametresParDefaut.adresse,
    texteAPropos: data.texte_a_propos || parametresParDefaut.texteAPropos,
    imageAccueilUrl: data.image_accueil_url || "",
    imagesDiaporama: data.images_diaporama || [],
    imageMaisonsUrl: data.image_maisons_url || "",
    imageHotelsUrl: data.image_hotels_url || "",
    imageSallesUrl: data.image_salles_url || "",
    couleurBoutonMaisons: data.couleur_bouton_maisons || "#2563eb",
    couleurBoutonHotels: data.couleur_bouton_hotels || "#2563eb",
    couleurBoutonSalles: data.couleur_bouton_salles || "#2563eb",
  };
}

export async function sauvegarderParametres(parametres: ParametresSite) {
  const { error } = await supabase.from("parametres_site").upsert({
    id: 1,
    nom_site: parametres.nomSite,
    description: parametres.description,
    email: parametres.email,
    telephone: parametres.telephone,
    whatsapp: parametres.whatsapp,
    adresse: parametres.adresse,
    texte_a_propos: parametres.texteAPropos,
    image_accueil_url: parametres.imageAccueilUrl,
    images_diaporama: parametres.imagesDiaporama,
    image_maisons_url: parametres.imageMaisonsUrl,
    image_hotels_url: parametres.imageHotelsUrl,
    image_salles_url: parametres.imageSallesUrl,
    couleur_bouton_maisons: parametres.couleurBoutonMaisons,
    couleur_bouton_hotels: parametres.couleurBoutonHotels,
    couleur_bouton_salles: parametres.couleurBoutonSalles,
  });
  if (error) throw new Error(error.message);
}

export interface MessageContact {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  message: string;
  bienId?: string;
  lu: boolean;
}

export async function envoyerMessageContact(msg: { nom: string; email: string; telephone: string; message: string; bienId?: string }) {
  const { error } = await supabase.from("messages_contact").insert({
    id: Date.now().toString(),
    nom: msg.nom,
    email: msg.email,
    telephone: msg.telephone,
    message: msg.message,
    bien_id: msg.bienId || null,
    lu: false,
  });
  if (error) throw new Error(error.message);
}

export async function getMessagesContact(): Promise<MessageContact[]> {
  const { data, error } = await supabase.from("messages_contact").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id, nom: d.nom, email: d.email, telephone: d.telephone,
    message: d.message, bienId: d.bien_id || undefined, lu: d.lu,
  }));
}

export async function marquerMessageLu(id: string) {
  await supabase.from("messages_contact").update({ lu: true }).eq("id", id);
}

export async function supprimerMessageContact(id: string) {
  await supabase.from("messages_contact").delete().eq("id", id);
}

export interface Reservation {
  id: string;
  typeBien: "salle" | "hotel";
  bienId: string;
  nomClient: string;
  emailClient: string;
  telephoneClient: string;
  dateDebut: string;
  dateFin: string;
  creneau?: string;
  statut: "en_attente" | "confirmee" | "refusee";
  message: string;
}

function reservationVersDb(r: Omit<Reservation, "id" | "statut">) {
  return {
    id: Date.now().toString(),
    type_bien: r.typeBien,
    bien_id: r.bienId,
    nom_client: r.nomClient,
    email_client: r.emailClient,
    telephone_client: r.telephoneClient,
    date_debut: r.dateDebut,
    date_fin: r.dateFin,
    creneau: r.creneau || null,
    statut: "en_attente",
    message: r.message,
  };
}

function dbVersReservation(d: any): Reservation {
  return {
    id: d.id,
    typeBien: d.type_bien,
    bienId: d.bien_id,
    nomClient: d.nom_client,
    emailClient: d.email_client,
    telephoneClient: d.telephone_client,
    dateDebut: d.date_debut,
    dateFin: d.date_fin,
    creneau: d.creneau || undefined,
    statut: d.statut,
    message: d.message,
  };
}

export async function creerReservation(r: Omit<Reservation, "id" | "statut">) {
  const { error } = await supabase.from("reservations").insert(reservationVersDb(r));
  if (error) throw new Error(error.message);
}

export async function getReservationsParBien(bienId: string): Promise<Reservation[]> {
  const { data, error } = await supabase.from("reservations").select("*").eq("bien_id", bienId).eq("statut", "confirmee");
  if (error || !data) return [];
  return data.map(dbVersReservation);
}

export async function getToutesReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase.from("reservations").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(dbVersReservation);
}

export async function changerStatutReservation(id: string, statut: "confirmee" | "refusee") {
  await supabase.from("reservations").update({ statut }).eq("id", id);
}

export async function supprimerReservation(id: string) {
  await supabase.from("reservations").delete().eq("id", id);
}