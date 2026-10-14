import type { CapacitorConfig } from "@capacitor/cli";

// Adresse du site en production : l'application affiche le site en direct, donc chaque
// deploiement Vercel met aussi l'application a jour (sans repasser par les stores).
const URL_SITE = "https://www.hrz360.com";

const config: CapacitorConfig = {
  // Identifiant definitif sur le Play Store et l'App Store : ne plus le changer apres publication.
  appId: "com.hrz360.app",
  appName: "Horizon 360",
  // Page locale affichee seulement si le site ne repond pas (pas de connexion).
  webDir: "www",
  // Permet au site de reconnaitre l'application (proxy.ts bloque l'administration).
  appendUserAgent: "Horizon360App",
  server: {
    url: URL_SITE,
    errorPath: "hors-ligne.html",
    // Domaines ouverts DANS l'application ; tout autre lien s'ouvre dans le navigateur.
    // Stripe : le paiement doit revenir dans l'application apres validation.
    allowNavigation: ["hrz360.com", "checkout.stripe.com", "*.stripe.com"],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
