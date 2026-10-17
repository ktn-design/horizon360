// Visite 360 dans un casque de realite virtuelle (Meta Quest, Pico...) via WebXR.
// Charge uniquement sur les appareils compatibles (voir vrDisponible dans VisiteVirtuelle).
//
// - Chaque piece est une sphere autour du visiteur. Image « stereo haut/bas » : l'oeil gauche
//   voit la moitie du haut, l'oeil droit celle du bas, d'ou le relief.
// - Les reperes vers les autres pieces flottent dans l'espace : on les vise avec la manette
//   (ou la main) et on appuie sur la gachette (ou on pince les doigts) pour changer de piece.
import * as THREE from "three";
import { Panorama360 } from "@/types";

const RAYON = 50;
const DISTANCE_REPERE = 6;
const COULEUR_SURVOL = new THREE.Color("#93c5fd");

interface OptionsVisiteVR {
  panoramas: Panorama360[];
  urlDepart: string;
  // Appelee a chaque changement de piece, pour retrouver la meme piece en sortant du casque.
  onChangementPiece: (url: string) => void;
}

// Direction d'un repere (yaw/pitch en radians, comme dans la visite classique) : yaw 0 = centre de l'image.
function direction(yaw: number, pitch: number): THREE.Vector3 {
  return new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
}

// Sphere vue de l'interieur. moitie : "haut" / "bas" pour une image stereo, null sinon.
function creerSphere(moitie: "haut" | "bas" | null): THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {
  const geometrie = new THREE.SphereGeometry(RAYON, 96, 48);
  geometrie.scale(-1, 1, 1);
  if (moitie) {
    const uv = geometrie.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, moitie === "haut" ? 0.5 + uv.getY(i) * 0.5 : uv.getY(i) * 0.5);
  }
  const sphere = new THREE.Mesh(geometrie, new THREE.MeshBasicMaterial());
  sphere.rotation.y = -Math.PI / 2; // centre de l'image droit devant
  return sphere;
}

// Etiquette dessinee sur un canvas : « VERS » + nom de la piece (ou un simple texte).
function creerEtiquette(titre: string, sousTitre: string, fond: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 256;
  const c = canvas.getContext("2d")!;
  c.fillStyle = fond;
  c.strokeStyle = "rgba(255,255,255,0.7)";
  c.lineWidth = 6;
  c.beginPath();
  c.roundRect(8, 48, 624, 160, 80);
  c.fill();
  c.stroke();
  c.fillStyle = "#ffffff";
  c.textAlign = "center";
  if (sousTitre) {
    c.font = "600 34px system-ui, sans-serif";
    c.globalAlpha = 0.75;
    c.fillText(sousTitre.toUpperCase(), 320, 108);
    c.globalAlpha = 1;
    c.font = "700 58px system-ui, sans-serif";
    c.fillText(titre, 320, 172, 580);
  } else {
    c.font = "700 58px system-ui, sans-serif";
    c.fillText(titre, 320, 148, 580);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set(2, 0.8, 1);
  sprite.renderOrder = 10;
  return sprite;
}

export async function vrDisponible(): Promise<boolean> {
  try {
    return !!navigator.xr && (await navigator.xr.isSessionSupported("immersive-vr"));
  } catch {
    return false;
  }
}

// Ouvre la visite dans le casque. Doit etre appelee depuis un clic (exigence des navigateurs).
// La promesse se termine quand le visiteur quitte la VR.
export async function lancerVisiteVR({ panoramas, urlDepart, onChangementPiece }: OptionsVisiteVR): Promise<void> {
  if (!navigator.xr) throw new Error("Realite virtuelle non disponible sur cet appareil.");
  // Demandee en premier, tant que le clic du visiteur est encore « frais ».
  const session = await navigator.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor", "hand-tracking"] });

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0f172a");
  const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 200);

  // Image classique : une sphere vue par les deux yeux. Image stereo : une sphere par oeil
  // (calques 1 et 2, que three.js reserve a l'oeil gauche et a l'oeil droit).
  const sphereMono = creerSphere(null);
  const sphereGauche = creerSphere("haut");
  const sphereDroite = creerSphere("bas");
  sphereGauche.layers.set(1);
  sphereDroite.layers.set(2);
  scene.add(sphereMono, sphereGauche, sphereDroite);

  const reperes = new THREE.Group();
  scene.add(reperes);

  const boutonQuitter = creerEtiquette("Quitter la VR", "", "rgba(220,38,38,0.85)");
  boutonQuitter.position.copy(direction(0, -0.9).multiplyScalar(4));
  boutonQuitter.scale.set(1.4, 0.56, 1);
  boutonQuitter.userData.quitter = true;
  scene.add(boutonQuitter);

  const chargeur = new THREE.TextureLoader();
  chargeur.setCrossOrigin("anonymous");
  let textureActuelle: THREE.Texture | null = null;
  let chargementEnCours = "";

  async function afficherPiece(url: string) {
    const panorama = panoramas.find((p) => p.url === url);
    chargementEnCours = url;
    reperes.clear();
    const texture = await chargeur.loadAsync(url);
    if (chargementEnCours !== url) {
      texture.dispose();
      return;
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const stereo = !!panorama?.stereo;
    sphereMono.material.map = stereo ? null : texture;
    sphereGauche.material.map = stereo ? texture : null;
    sphereDroite.material.map = stereo ? texture : null;
    for (const s of [sphereMono, sphereGauche, sphereDroite]) s.material.needsUpdate = true;
    sphereMono.visible = !stereo;
    sphereGauche.visible = stereo;
    sphereDroite.visible = stereo;
    textureActuelle?.dispose();
    textureActuelle = texture;

    for (const hotspot of panorama?.hotspots || []) {
      const cible = panoramas.find((p) => p.url === hotspot.panoramaCible);
      const etiquette = creerEtiquette(cible?.nom || hotspot.label, "Vers", "rgba(15,23,42,0.75)");
      etiquette.position.copy(direction(hotspot.yaw, hotspot.pitch).multiplyScalar(DISTANCE_REPERE));
      etiquette.userData.cible = hotspot.panoramaCible;
      reperes.add(etiquette);
    }
    onChangementPiece(url);
  }

  // Manettes (ou mains) : un rayon pour viser, la gachette (ou le pincement) pour choisir.
  const raycaster = new THREE.Raycaster();
  const manettes = [0, 1].map((i) => {
    const manette = renderer.xr.getController(i);
    const rayon = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
    );
    rayon.scale.z = 8;
    manette.add(rayon);
    manette.addEventListener("select", () => {
      const vise = objetVise(manette);
      if (!vise) return;
      if (vise.userData.quitter) session.end();
      else if (vise.userData.cible) afficherPiece(vise.userData.cible).catch(() => {});
    });
    scene.add(manette);
    return manette;
  });

  function objetVise(manette: THREE.XRTargetRaySpace): THREE.Object3D | null {
    raycaster.setFromXRController(manette);
    raycaster.camera = renderer.xr.getCamera();
    const touches = raycaster.intersectObjects([...reperes.children, boutonQuitter], false);
    return touches[0]?.object || null;
  }

  renderer.setAnimationLoop(() => {
    // Survol : l'etiquette visee grossit et se teinte.
    const vises = new Set(manettes.map((m) => objetVise(m)).filter(Boolean));
    for (const objet of [...reperes.children, boutonQuitter] as THREE.Sprite[]) {
      const survole = vises.has(objet);
      objet.material.color.copy(survole ? COULEUR_SURVOL : new THREE.Color(0xffffff));
      const base = objet.userData.quitter ? 1.4 : 2;
      objet.scale.set(base * (survole ? 1.15 : 1), base * 0.4 * (survole ? 1.15 : 1), 1);
    }
    renderer.render(scene, camera);
  });

  await renderer.xr.setSession(session);
  afficherPiece(urlDepart).catch(() => {});

  await new Promise<void>((resolve) => session.addEventListener("end", () => resolve(), { once: true }));

  renderer.setAnimationLoop(null);
  (textureActuelle as THREE.Texture | null)?.dispose();
  scene.traverse((objet) => {
    const maillage = objet as THREE.Mesh;
    maillage.geometry?.dispose();
    const materiau = maillage.material as THREE.Material & { map?: THREE.Texture | null };
    materiau?.map?.dispose();
    materiau?.dispose?.();
  });
  renderer.dispose();
}
