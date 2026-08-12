import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinataire, sujet, contenu } = body;

    await resend.emails.send({
      from: "Horizon 360 <contact@hrz360.com>",
      to: destinataire,
      subject: sujet,
      html: contenu,
    });

    return NextResponse.json({ succes: true });
  } catch (error) {
    return NextResponse.json({ succes: false, erreur: String(error) }, { status: 500 });
  }
}