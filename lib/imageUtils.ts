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
