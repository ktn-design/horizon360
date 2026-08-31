import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    const prompt =
      "Tu es un assistant qui extrait des criteres de recherche de chambre d'hotel a partir d'une phrase en langage naturel, en francais OU en anglais. " +
      "Detecte automatiquement la langue de la phrase et comprends-la, quelle que soit la langue utilisee. " +
      "Analyse la phrase et reponds UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, sans balises markdown, sans explication. " +
      "Format exact attendu : " +
      '{"prixMax": null, "capaciteMin": null, "typeLit": "", "estSuite": null, "ville": ""}. ' +
      "Regles importantes : " +
      "Si la phrase indique un prix maximum par nuit (francais: 'moins de X dollars', 'sous X dollars', 'X dollars maximum' ; anglais: 'under X dollars', 'less than X dollars', 'max X dollars'), prixMax = X (nombre JSON, jamais entre guillemets). " +
      "Si la phrase indique un nombre de personnes (ex: 'pour 2 personnes', 'for 4 people', 'capacite de 3'), capaciteMin = ce nombre. " +
      "typeLit doit etre exactement 'queen', 'king', 'jumeaux', ou une chaine vide si non mentionne - normalise 'queen size'/'lit queen' en 'queen', 'king size'/'lit king' en 'king', 'lits jumeaux'/'twin beds'/'deux lits' en 'jumeaux'. " +
      "estSuite doit etre true si la phrase demande explicitement une suite, false si elle demande explicitement que ce n'en soit PAS une, ou null si ce n'est pas mentionne. " +
      "ville : le nom de la ville mentionnee, sinon une chaine vide. " +
      "Si une information n'est pas mentionnee, utilise une chaine vide pour le texte, null pour les nombres/booleens. " +
      "Phrase a analyser : " + question;

    const reponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      }
    );

    const data = await reponse.json();
    let texteReponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    texteReponse = texteReponse.replace(/```json/g, "").replace(/```/g, "").trim();

    const premierAccolade = texteReponse.indexOf("{");
    const dernierAccolade = texteReponse.lastIndexOf("}");
    if (premierAccolade !== -1 && dernierAccolade !== -1) {
      texteReponse = texteReponse.substring(premierAccolade, dernierAccolade + 1);
    }

    let criteres = {};
    try {
      criteres = JSON.parse(texteReponse);
    } catch (parseError) {
      criteres = {};
    }

    return NextResponse.json({ criteres });
  } catch (error) {
    return NextResponse.json({ criteres: {}, erreur: String(error) }, { status: 500 });
  }
}
