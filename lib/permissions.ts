// Roles et permissions des administrateurs, partages entre le serveur (proxy.ts,
// routes /api/admin) et l'interface. La base (RLS) applique les memes regles :
// voir supabase/migrations/20260925_admins_permissions.sql.

export type SectionAdmin = "hotels" | "chambres" | "salles" | "maisons";
export type RoleAdmin = "principal" | "secondaire";

export const SECTIONS_ADMIN: { id: SectionAdmin; libelle: string }[] = [
  { id: "hotels", libelle: "Hotels" },
  { id: "chambres", libelle: "Chambres (ajouter / modifier / supprimer)" },
  { id: "salles", libelle: "Salles de fete" },
  { id: "maisons", libelle: "Maisons (et societes / immeubles)" },
];

export interface ProfilAdmin {
  userId: string;
  email: string;
  role: RoleAdmin;
  permissions: SectionAdmin[];
  actif: boolean;
}

// Cookie qui transmet la session admin au serveur (proxy.ts) pour proteger les pages /admin.
export const COOKIE_SESSION_ADMIN = "h360_admin_jeton";

export function lirePermissions(valeur: unknown): SectionAdmin[] {
  if (!Array.isArray(valeur)) return [];
  const valides = SECTIONS_ADMIN.map((s) => s.id);
  return valides.filter((s) => valeur.includes(s));
}

export function dbVersProfilAdmin(d: any): ProfilAdmin {
  return {
    userId: d.user_id,
    email: d.email,
    role: d.role === "principal" ? "principal" : "secondaire",
    permissions: lirePermissions(d.permissions),
    actif: d.actif === true,
  };
}

export function aPermission(profil: ProfilAdmin, section: SectionAdmin): boolean {
  if (!profil.actif) return false;
  return profil.role === "principal" || profil.permissions.includes(section);
}

// Section necessaire pour ouvrir une page /admin :
// "tous" = n'importe quel admin actif ; "principal" = administrateur principal uniquement.
export function sectionPourChemin(chemin: string): SectionAdmin | "tous" | "principal" {
  const p = chemin.replace(/\/+$/, "");
  if (p === "/admin/dashboard" || p === "/admin/mon-compte") return "tous";
  if (/^\/admin\/hotels\/[^/]+\/chambres(\/|$)/.test(p)) return "chambres";
  if (p.startsWith("/admin/hotels")) return "hotels";
  if (p.startsWith("/admin/salles")) return "salles";
  if (p.startsWith("/admin/maisons") || p.startsWith("/admin/societes")) return "maisons";
  // parametres, messages, reservations, statistiques, administrateurs, journal...
  return "principal";
}

export function peutOuvrirPage(profil: ProfilAdmin, chemin: string): boolean {
  if (!profil.actif) return false;
  const section = sectionPourChemin(chemin);
  if (section === "tous") return true;
  if (section === "principal") return profil.role === "principal";
  return aPermission(profil, section);
}

// Lit le profil admin de l'utilisateur a qui appartient ce jeton de session, directement
// aupres de Supabase (le jeton est verifie par Supabase : signature et expiration).
// Renvoie null si le jeton est invalide/expire ou si l'utilisateur n'est pas admin.
export async function profilDepuisJeton(jeton: string): Promise<ProfilAdmin | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle || !jeton) return null;

  const reponse = await fetch(url + "/rest/v1/rpc/mon_profil_admin", {
    method: "POST",
    headers: {
      apikey: cle,
      Authorization: "Bearer " + jeton,
      "Content-Type": "application/json",
    },
    body: "{}",
    cache: "no-store",
  });
  if (!reponse.ok) return null;
  const lignes = await reponse.json();
  if (!Array.isArray(lignes) || lignes.length === 0) return null;
  return dbVersProfilAdmin(lignes[0]);
}
