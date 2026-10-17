import { supabase } from "./supabase";

// Vrai quand le site est affiche dans l'application mobile Horizon 360 (Capacitor) :
// mobile/capacitor.config.ts ajoute "Horizon360App" a l'identifiant du navigateur.
export function estAppMobile(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent.includes("Horizon360App");
}

// Adresse de retour vers l'application apres la connexion Google (declaree dans
// mobile/android/app/src/main/AndroidManifest.xml et dans Supabase > Auth > Redirect URLs).
export const URL_RETOUR_APP = "com.hrz360.app://auth";

// Identifiant client Web Google (le meme que dans Supabase > Auth > Google). Public : il
// figure dans chaque lien de connexion Google. Google ne fournit un jeton a l'application
// que si son paquet (com.hrz360.app) et sa cle de signature (SHA-1) sont declares dans
// Google Cloud > Identifiants, sur un client OAuth de type Android.
const ID_CLIENT_WEB_GOOGLE = "256293199387-dsvoickpg3u171ju2sgla5q1c6o6bnli.apps.googleusercontent.com";

async function sha256Hex(texte: string): Promise<string> {
  const empreinte = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return Array.from(new Uint8Array(empreinte)).map((o) => o.toString(16).padStart(2, "0")).join("");
}

// Connexion Google dans l'application : liste des comptes du telephone (native).
// A defaut (ancienne version de l'app, telephone sans services Google...), page Google dans Chrome.
export async function connexionGoogleApp() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isPluginAvailable("SocialLogin")) {
    await connexionGoogleNavigateur();
    return;
  }

  try {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.initialize({ google: { webClientId: ID_CLIENT_WEB_GOOGLE } });

    // Google recoit l'empreinte du nonce, Supabase le nonce lui-meme : il verifie qu'ils correspondent.
    const nonce = crypto.randomUUID();
    const reponse = await SocialLogin.login({
      provider: "google",
      options: { style: "bottom", nonce: await sha256Hex(nonce) },
    });
    const idToken = reponse.result.responseType === "online" ? reponse.result.idToken : null;
    if (!idToken) throw new Error("Google n'a pas renvoye d'identite.");

    const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken, nonce });
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string })?.code;
    if (code === "USER_CANCELLED" || /cancel/i.test(message)) return;
    if (confirm("La connexion Google rapide n'a pas abouti (" + message + ").\n\nContinuer avec la page de connexion Google ?")) {
      await connexionGoogleNavigateur();
    }
  }
}

// Solution de secours : page Google ouverte dans Chrome, qui renvoie ensuite vers
// l'application (voir ecouterRetourConnexionApp).
async function connexionGoogleNavigateur() {
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
