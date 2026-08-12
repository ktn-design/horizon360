import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, contexte } = body;

    const prompt =
      "Tu es un conseiller en decoration et amenagement interieur pour une plateforme immobiliere. " +
      "Voici les informations sur la piece ou le bien concerne : " + contexte + ". " +
      "Question du visiteur : " + question + ". " +
      "Reponds de maniere concrete, chaleureuse et utile, en francais, en 3-4 phrases maximum.";

    const reponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await reponse.json();
    console.log("Reponse complete de Gemini:", JSON.stringify(data));
    const texteReponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desole, je n'ai pas pu generer une reponse.";

    return NextResponse.json({ reponse: texteReponse });
  } catch (error) {
    return NextResponse.json({ reponse: "Une erreur est survenue.", erreur: String(error) }, { status: 500 });
  }
}