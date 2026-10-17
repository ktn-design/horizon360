import { supabase } from "./supabase";

// Vrai quand le site est affiche dans l'application mobile Horizon 360 (Capacitor) :
// mobile/capacitor.config.ts ajoute "Horizon360App" a l'identifiant du navigateur.
export function estAppMobile(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent.includes("Horizon360App");
}

// Adresse de retour vers l'application apres la connexion Google (declaree dans
// mobile/android/app/src/main/AndroidManifest.xml et dans Supabase > Auth > Redirect URLs).
export const URL_RETOUR_APP = "com.hrz360.app://auth";

// Google refuse de se connecter dans l'application (WebView) : on ouvre sa page dans
// Chrome, qui renvoie ensuite vers l'application (voir ecouterRetourConnexionApp).
export async function connexionGoogleApp() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: URL_RETOUR_APP, skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    alert("Connexion Google impossible : " + (error?.message || "reessayez."));
    return;
  }
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url: data.url });
}

// A l'arrivee sur com.hrz360.app://auth#access_token=...&refresh_token=... :
// on ouvre la session dans l'application et on ferme Chrome.
export async function ecouterRetourConnexionApp(): Promise<() => void> {
  const { App } = await import("@capacitor/app");
  const { Browser } = await import("@capacitor/browser");

  const ecouteur = await App.addListener("appUrlOpen", async ({ url }) => {
    if (!url.startsWith(URL_RETOUR_APP)) return;
    Browser.close().catch(() => {});

    const params = new URLSearchParams(url.split("#")[1] || url.split("?")[1] || "");
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) alert("Connexion Google impossible : " + error.message);
    } else if (params.get("error")) {
      alert("Connexion Google annulee ou refusee : " + (params.get("error_description") || params.get("error")));
    }
  });

  return () => {
    ecouteur.remove();
  };
}
