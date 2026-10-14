// Vrai quand le site est affiche dans l'application mobile Horizon 360 (Capacitor) :
// mobile/capacitor.config.ts ajoute "Horizon360App" a l'identifiant du navigateur.
export function estAppMobile(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent.includes("Horizon360App");
}
