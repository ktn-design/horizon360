import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface PieceJointe {
  nomFichier: string;
  contenu: Buffer;
}

export async function envoyerEmailAvecPieceJointe(params: {
  destinataire: string;
  sujet: string;
  contenu: string;
  piecesJointes?: PieceJointe[];
}) {
  await resend.emails.send({
    from: "Horizon 360 <contact@hrz360.com>",
    to: params.destinataire,
    subject: params.sujet,
    html: params.contenu,
    attachments: (params.piecesJointes || []).map((p) => ({
      filename: p.nomFichier,
      content: p.contenu,
    })),
  });
}
