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

export async function uploaderPhoto(fichier: File): Promise<string> {
  const extension = fichier.name.split(".").pop();
  const nomFichier = Date.now() + "-" + Math.random().toString(36).slice(2) + "." + extension;

  const { error } = await supabase.storage.from("photos").upload(nomFichier, fichier);

  if (error) {
    throw new Error(messageErreurPhoto(error as { message: string; statusCode?: string }, fichier.name));
  }

  const { data } = supabase.storage.from("photos").getPublicUrl(nomFichier);
  return data.publicUrl;
}