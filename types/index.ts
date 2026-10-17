export type StatutBien = "disponible" | "loue" | "vendu" | "indisponible";
export type TypeTransaction = "vente" | "location" | "location_courte_duree";
export type TypeEvenement = "mariage" | "anniversaire" | "bal" | "deuil" | "fete" | "conference" | "polyvalente";

export interface Localisation {
  pays: string;
  province: string;
  ville: string;
  quartier?: string;
}

export interface Hotspot360 {
  id: string;
  yaw: number;
  pitch: number;
  label: string;
  panoramaCible: string;
}

// Extra payant propose par un hotel ou une salle (petit-dejeuner, kayak, traiteur...).
export type FacturationExtra = "forfait" | "par_nuit" | "par_personne" | "par_personne_par_nuit";

export interface Extra {
  id: string;
  nom: string;
  prix: number;
  facturation: FacturationExtra;
}

export interface Panorama360 {
  id: string;
  nom: string;
  url: string;
  hotspots: Hotspot360[];
  // Image 360 stereoscopique « haut/bas » (oeil gauche en haut, oeil droit en bas), exportee
  // par Lumion, Enscape, Twinmotion, D5... : relief dans un casque VR. Hors casque, seule
  // la moitie du haut est affichee.
  stereo?: boolean;
}

export interface Maison {
  id: string;
  titre: string;
  description: string;
  prix: number;
  transaction: TypeTransaction;
  statut: StatutBien;
  localisation: Localisation;
  chambres: number;
  sallesDeBain: number;
  superficie: number;
  parking: boolean;
  piscine: boolean;
  jardin: boolean;
  meublee: boolean;
  climatisation: boolean;
  internet: boolean;
  visiteVirtuelle: boolean;
  immeubleId?: string;
  photos: string[];
  panorama360Url?: string;
  panoramas?: Panorama360[];
  // Maquette 3D (fichier .glb) que le client fait tourner ; facultative.
  maquette3dUrl?: string;
  contact: {
    whatsapp: string;
    telephone: string;
  };
}

export interface Hotel {
  id: string;
  titre: string;
  description: string;
  prixParNuit: number;
  statut: StatutBien;
  localisation: Localisation;
  etoiles: number;
  wifi: boolean;
  parking: boolean;
  piscine: boolean;
  salleDeSport: boolean;
  restaurant: boolean;
  petitDejeunerInclus: boolean;
  climatisation: boolean;
  visiteVirtuelle: boolean;
  photos: string[];
  panorama360Url?: string;
  panoramas?: Panorama360[];
  extras?: Extra[];
  contact: {
    whatsapp: string;
    telephone: string;
  };
}

export interface Salle {
  id: string;
  titre: string;
  description: string;
  prix: number;
  statut: StatutBien;
  localisation: Localisation;
  capacite: number;
  superficie: number;
  evenementsAcceptes: TypeEvenement[];
  parking: boolean;
  climatisation: boolean;
  sonorisation: boolean;
  eclairageEvenementiel: boolean;
  cuisine: boolean;
  wifi: boolean;
  visiteVirtuelle: boolean;
  photos: string[];
  panorama360Url?: string;
  panoramas?: Panorama360[];
  // Maquette 3D (fichier .glb) que le client fait tourner ; facultative.
  maquette3dUrl?: string;
  extras?: Extra[];
  contact: {
    whatsapp: string;
    telephone: string;
  };
}

export interface ParametresSite {
  nomSite: string;
  description: string;
  email: string;
  telephone: string;
  whatsapp: string;
  adresse: string;
  texteAPropos: string;
  imageAccueilUrl: string;
  imagesDiaporama: string[];
  imageMaisonsUrl: string;
  imagesDiaporamaMaisons: string[];
  imageHotelsUrl: string;
  imagesDiaporamaHotels: string[];
  imageSallesUrl: string;
  imagesDiaporamaSalles: string[];
  couleurBoutonMaisons: string;
  couleurBoutonHotels: string;
  couleurBoutonSalles: string;
}

export interface Societe {
  id: string;
  nom: string;
  description: string;
  logoUrl: string;
  whatsapp: string;
  telephone: string;
}

// Repere pose sur la maquette 3D d'un immeuble : situe un appartement (une « maison »
// rattachee a l'immeuble). position / normal : coordonnees 3D au format de model-viewer ("x y z").
export interface RepereMaquette {
  id: string;
  maisonId: string;
  libelle: string;
  position: string;
  normal: string;
}

export interface Immeuble {
  id: string;
  societeId: string;
  nom: string;
  description: string;
  localisation: Localisation;
  // La premiere photo sert de photo d'accueil.
  photos: string[];
  // Maquette 3D de l'immeuble (.glb) et reperes des appartements ; facultatifs.
  maquette3dUrl?: string;
  reperesMaquette?: RepereMaquette[];
}

export interface Chambre {
  id: string;
  hotelId: string;
  nom: string;
  description: string;
  prixParNuit: number;
  capacite: number;
  statut: StatutBien;
  photos: string[];
  panorama360Url?: string;
  visiteVirtuelle: boolean;
}