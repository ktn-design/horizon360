export async function envoyerEmail(destinataire: string, sujet: string, contenu: string) {
  try {
    await fetch("/api/envoyer-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataire, sujet, contenu }),
    });
  } catch (err) {
    console.error("Erreur envoi email:", err);
  }
}