// Image 360 « stereo haut/bas » affichee hors casque VR (telephone, ordinateur) : on ne garde
// que la moitie du haut (oeil gauche), sinon la visite montrerait l'image en double.
const cache = new Map<string, Promise<string>>();

function decouperMoitieHaute(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = Math.round(image.naturalHeight / 2);
      const contexte = canvas.getContext("2d");
      if (!contexte) return reject(new Error("canvas indisponible"));
      contexte.drawImage(image, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error("decoupage impossible"))), "image/jpeg", 0.9);
    };
    image.onerror = () => reject(new Error("image introuvable"));
    image.src = url;
  });
}

// Adresse a donner a la visite classique pour ce panorama.
export function sourceAffichage(url: string, stereo: boolean | undefined): Promise<string> {
  if (!stereo) return Promise.resolve(url);
  if (!cache.has(url)) {
    // En cas d'echec, on affiche l'image entiere plutot que rien.
    cache.set(url, decouperMoitieHaute(url).catch(() => url));
  }
  return cache.get(url)!;
}
