import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    const prompt =
      "Tu es un assistant qui extrait des criteres de recherche immobiliere a partir d'une phrase en langage naturel, en francais OU en anglais. " +
      "Detecte automatiquement la langue de la phrase et comprends-la, quelle que soit la langue utilisee. " +
      "Analyse la phrase et reponds UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, sans balises markdown, sans explication. " +
      "Format exact attendu : " +
      '{"pays": "", "province": "", "ville": "", "quartier": "", "prixMax": null, "prixMin": null, "chambresMin": null, "typeTransaction": ""}. ' +
      "Regles importantes : " +
      "Si la phrase indique un maximum (francais: 'moins de X dollars', 'sous X dollars', 'X dollars maximum' ; anglais: 'under X dollars', 'less than X dollars', 'max X dollars'), prixMax = X. " +
      "Si la phrase indique un minimum (francais: 'plus de X dollars', 'au moins X dollars', 'a partir de X dollars' ; anglais: 'over X dollars', 'at least X dollars', 'from X dollars'), prixMin = X. " +
      "Les nombres doivent etre de vrais nombres JSON, jamais entre guillemets, jamais avec des espaces ou virgules de separation de milliers. " +
      "Si une information n'est pas mentionnee, utilise une chaine vide pour le texte ou null pour les nombres. " +
      "typeTransaction doit etre exactement vente, location, location_courte_duree, ou une chaine vide (peu importe la langue de la phrase d'origine, garde ces valeurs en francais). " +
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