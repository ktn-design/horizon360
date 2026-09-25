// Traduit les erreurs techniques de Supabase (base de donnees et stockage des photos)
// en messages clairs pour l'admin, avec la cause et quoi faire.

interface ErreurSupabase {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
  statusCode?: string | number;
}

export function messageErreurBase(erreur: ErreurSupabase, quoi: string): string {
  const code = erreur.code || "";
  const message = erreur.message || "";

  // Colonne absente de la table : la base n'a pas recu une migration.
  const colonne = message.match(/'([^']+)' column of '([^']+)'/) || message.match(/column [\w.]*?(\w+)\.(\w+) does not exist/);
  if (code === "PGRST204" || code === "42703") {
    const nom = colonne ? (code === "PGRST204" ? colonne[1] : colonne[2]) : "inconnue";
    return (
      "Impossible d'enregistrer " + quoi + " : la base de donnees n'est pas a jour (colonne « " + nom + " » manquante). " +
      "Appliquez le dernier script du dossier supabase/migrations dans Supabase > SQL Editor, puis reessayez."
    );
  }
  if (code === "PGRST205" || code === "42P01") {
    return "Impossible d'enregistrer " + quoi + " : une table est manquante dans la base. Appliquez les scripts du dossier supabase/migrations.";
  }
  if (code === "42501" || /row-level security/i.test(message)) {
    return (
      "Enregistrement refuse : votre compte n'a pas la permission de modifier " + quoi + ". " +
      "Votre session a peut-etre expire, ou votre compte a ete suspendu : reconnectez-vous ou contactez l'administrateur principal."
    );
  }
  if (code === "23503") {
    return "Impossible d'enregistrer " + quoi + " : l'element auquel il est rattache (ex. l'hotel) n'existe plus. Rechargez la page.";
  }
  if (code === "23505") {
    return "Impossible d'enregistrer " + quoi + " : un element avec le meme identifiant existe deja. Reessayez.";
  }
  if (code === "23502") {
    return "Impossible d'enregistrer " + quoi + " : un champ obligatoire est vide (" + (message.match(/"(\w+)"/)?.[1] || "champ inconnu") + ").";
  }
  if (code === "22P02" || code === "22003") {
    return "Impossible d'enregistrer " + quoi + " : une valeur saisie n'est pas valide (nombre trop grand ou mauvais format).";
  }
  if (code === "PGRST301" || /jwt/i.test(message)) {
    return "Votre session a expire. Reconnectez-vous puis reessayez.";
  }
  if (/fetch|network/i.test(message)) {
    return "Connexion a la base impossible. Verifiez votre connexion internet puis reessayez.";
  }
  return "Impossible d'enregistrer " + quoi + " : " + message + (code ? " (code " + code + ")" : "");
}

export function messageErreurPhoto(erreur: ErreurSupabase, nomFichier: string): string {
  const message = erreur.message || "";
  const statut = String(erreur.statusCode || "");
  if (/bucket not found/i.test(message)) {
    return "Photo « " + nomFichier + " » non envoyee : l'espace de stockage « photos » n'existe pas dans Supabase Storage.";
  }
  if (statut === "413" || /too large|exceeded the maximum/i.test(message)) {
    return "Photo « " + nomFichier + " » trop lourde. Reduisez sa taille (moins de 5 Mo conseille) puis reessayez.";
  }
  if (/mime|content type|invalid_mime/i.test(message)) {
    return "Photo « " + nomFichier + " » refusee : format non accepte. Utilisez un fichier JPG, PNG ou WEBP.";
  }
  if (statut === "403" || /row-level security|unauthorized|not authorized/i.test(message)) {
    return "Photo « " + nomFichier + " » refusee : votre session a expire ou vous n'avez pas le droit d'envoyer des photos. Reconnectez-vous.";
  }
  if (/fetch|network/i.test(message)) {
    return "Photo « " + nomFichier + " » non envoyee : connexion internet interrompue.";
  }
  return "Photo « " + nomFichier + " » non envoyee : " + message;
}

// Pour afficher une erreur attrapee dans un try/catch.
export function texteErreur(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
