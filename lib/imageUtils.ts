import { supabase } from "./supabase";
import { messageErreurPhoto } from "./erreurs";

export async function fichierVersBase64(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(lecteur.result as string);
    lecteur.onerror = reject;
    lecteur.readAsDataURL(fichier);
  });
}

// Largeur maximale apres compression. Panorama 360 : 5760 x 2880 (limite de taille des
// images que les iPhone savent traiter), assez pour une visite nette.
const LARGEUR_MAX_PHOTO = 2560;
const LARGEUR_MAX_PANORAMA = 5760;
// En dessous de ce poids et de cette largeur, la photo est envoyee telle quelle.
const POIDS_SANS_COMPRESSION = 600 * 1024;

// Reduit une photo trop grande ou trop lourde avant l'envoi (une photo de telephone fait
// souvent 4 a 10 Mo) : le site reste rapide quel que soit ce que l'admin envoie.
// En cas de probleme (format inconnu, navigateur ancien), la photo d'origine est gardee.
async function compresserImage(fichier: File, largeurMax: number): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(fichier.type)) return fichier;
  try {
    const image = await createImageBitmap(fichier);
    if (image.width <= largeurMax && fichier.size <= POIDS_SANS_COMPRESSION) {
      image.close();
      return fichier;
    }
    const echelle = Math.min(1, largeurMax / image.width);
    const largeur = Math.round(image.width * echelle);
    const hauteur = Math.round(image.height * echelle);

    const canvas = document.createElement("canvas");
    canvas.width = largeur;
    canvas.height = hauteur;
    const contexte = canvas.getContext("2d");
    if (!contexte) return fichier;
    contexte.drawImage(image, 0, 0, largeur, hauteur);
    image.close();

    // PNG (logos avec transparence) -> WebP ; sinon JPEG.
    const type = fichier.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
    // Navigateur incapable de produire ce format, ou resultat plus lourd : on garde l'original.
    if (!blob || blob.type !== type || blob.size >= fichier.size) return fichier;

    const extension = type === "image/webp" ? "webp" : "jpg";
    return new File([blob], fichier.name.replace(/\.[^.]+$/, "") + "." + extension, { type });
  } catch {
    return fichier;
  }
}

export async function uploaderPhoto(fichierOriginal: File, options?: { panorama?: boolean }): Promise<string> {
  const fichier = await compresserImage(fichierOriginal, options?.panorama ? LARGEUR_MAX_PANORAMA : LARGEUR_MAX_PHOTO);
  const extension = fichier.name.split(".").pop();
  const nomFichier = Date.now() + "-" + Math.random().toString(36).slice(2) + "." + extension;

  const { error } = await supabase.storage.from("photos").upload(nomFichier, fichier, {
    contentType: fichier.type || undefined,
    // Nom unique : la photo ne change jamais, le navigateur peut la garder longtemps.
    cacheControl: "31536000",
  });

  if (error) {
    throw new Error(messageErreurPhoto(error as { message: string; statusCode?: string }, fichierOriginal.name));
  }

  const { data } = supabase.storage.from("photos").getPublicUrl(nomFichier);
  return data.publicUrl;
}

// Maquette 3D : fichier .glb (export « glTF binaire » de SketchUp, Blender, Revit...).
export const POIDS_MAX_MAQUETTE = 50 * 1024 * 1024;
export const POIDS_CONSEILLE_MAQUETTE = 20 * 1024 * 1024;

export async function uploaderMaquette3D(fichier: File): Promise<string> {
  if (!/\.glb$/i.test(fichier.name)) {
    throw new Error("Fichier « " + fichier.name + " » refuse : la maquette doit etre au format .glb (glTF binaire). Demandez cet export a votre architecte.");
  }
  if (fichier.size > POIDS_MAX_MAQUETTE) {
    throw new Error(
      "Maquette trop lourde (" + Math.round(fichier.size / 1024 / 1024) + " Mo, maximum 50 Mo). " +
      "Demandez une version allegee (textures reduites, compression Draco) : moins de 20 Mo pour un chargement rapide sur telephone."
    );
  }

  const nomFichier = Date.now() + "-" + Math.random().toString(36).slice(2) + ".glb";
  const { error } = await supabase.storage.from("maquettes").upload(nomFichier, fichier, {
    contentType: "model/gltf-binary",
    cacheControl: "31536000",
  });
  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new Error("L'espace de stockage « maquettes » n'existe pas encore : appliquez le script supabase/migrations/20261017_maquettes_3d.sql dans Supabase > SQL Editor.");
    }
    throw new Error(messageErreurPhoto(error as { message: string; statusCode?: string }, fichier.name).replace("Photo", "Maquette"));
  }

  const { data } = supabase.storage.from("maquettes").getPublicUrl(nomFichier);
  return data.publicUrl;
}
