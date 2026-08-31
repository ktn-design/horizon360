import PDFDocument from "pdfkit";

export interface DonneesPdfConfirmation {
  numeroConfirmation: string;
  nomClient: string;
  emailClient: string;
  telephoneClient: string;
  nomBien: string;
  nomChambre?: string;
  typeLit?: string;
  capaciteChambre?: number;
  estSuite?: boolean;
  commodites: string[];
  dateReservation: Date;
  periode: string;
  montant: number;
  payeEnLigne: boolean;
  logoBuffer?: Buffer;
}

const BLEU = "#2563eb";
const GRIS_FONCE = "#1e293b";
const GRIS = "#64748b";
const EMERAUDE = "#059669";

function ligneSection(doc: PDFKit.PDFDocument, titre: string) {
  doc.moveDown(1);
  doc.fontSize(13).fillColor(GRIS_FONCE).font("Helvetica-Bold").text(titre);
  doc.moveTo(doc.x, doc.y + 2).lineTo(545, doc.y + 2).strokeColor("#e2e8f0").lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(11).fillColor("#0f172a");
}

function dessinerCachet(doc: PDFKit.PDFDocument, cx: number, cy: number, dateConfirmation: string) {
  doc.save();
  doc.rotate(-10, { origin: [cx, cy] });
  doc.circle(cx, cy, 52).lineWidth(1.5).strokeColor(BLEU).stroke();
  doc.circle(cx, cy, 45).lineWidth(0.75).strokeColor(BLEU).stroke();

  const largeur = 96;
  const gauche = cx - largeur / 2;
  doc
    .fontSize(9)
    .fillColor(BLEU)
    .font("Helvetica-Bold")
    .text("HORIZON 360", gauche, cy - 30, { width: largeur, align: "center" });
  doc.fontSize(6).font("Helvetica").fillColor(BLEU);
  doc.text("CONFIRME", gauche, cy - 12, { width: largeur, align: "center" });
  doc.text("ELECTRONIQUEMENT", gauche, cy - 3, { width: largeur, align: "center" });
  doc.text("PAR HORIZON 360", gauche, cy + 6, { width: largeur, align: "center" });
  doc.fontSize(6.5).text(dateConfirmation, gauche, cy + 20, { width: largeur, align: "center" });
  doc.restore();
}

export async function genererPdfConfirmation(d: DonneesPdfConfirmation): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const morceaux: Buffer[] = [];
    doc.on("data", (c) => morceaux.push(c));
    doc.on("end", () => resolve(Buffer.concat(morceaux)));
    doc.on("error", reject);

    // En-tete
    if (d.logoBuffer) {
      try {
        doc.image(d.logoBuffer, 50, 45, { width: 55 });
      } catch {
        // logo illisible, on continue sans
      }
    }
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor(GRIS_FONCE)
      .text("Horizon 360", 115, 50);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(GRIS)
      .text("Confirmation de reservation", 115, 75);

    doc
      .fontSize(10)
      .fillColor(GRIS)
      .text("N° de confirmation", 400, 50, { width: 145, align: "right" });
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(GRIS_FONCE)
      .text(d.numeroConfirmation, 400, 63, { width: 145, align: "right" });

    doc.moveTo(50, 110).lineTo(545, 110).strokeColor("#cbd5e1").lineWidth(1).stroke();
    doc.y = 125;
    doc.x = 50;

    // Informations client
    ligneSection(doc, "Informations client");
    doc.text("Nom : " + d.nomClient);
    doc.text("Email : " + d.emailClient);
    doc.text("Telephone : " + d.telephoneClient);

    // Details du bien
    ligneSection(doc, "Details du bien reserve");
    doc.text("Bien : " + d.nomBien);
    if (d.nomChambre) doc.text("Chambre : " + d.nomChambre);
    if (d.typeLit) doc.text("Type de lit : " + d.typeLit);
    if (d.capaciteChambre) doc.text("Capacite : " + d.capaciteChambre + " personnes");
    if (d.estSuite !== undefined) doc.text("Suite : " + (d.estSuite ? "Oui" : "Non"));
    if (d.commodites.length > 0) {
      doc.text("Commodites incluses : " + d.commodites.join(", "));
    }

    // Dates
    ligneSection(doc, "Dates");
    doc.text(
      "Date de la reservation : " +
        d.dateReservation.toLocaleDateString("fr-CA") +
        " a " +
        d.dateReservation.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })
    );
    doc.text(d.periode);

    // Paiement
    ligneSection(doc, "Paiement");
    doc.fontSize(14).font("Helvetica-Bold").fillColor(EMERAUDE);
    doc.text(d.montant.toLocaleString("fr-CA") + " $ " + (d.payeEnLigne ? "(paye en ligne)" : "(a regler sur place)"));
    doc.font("Helvetica").fontSize(11).fillColor("#0f172a");

    // Cachet
    const yCachet = Math.max(doc.y + 60, 650);
    dessinerCachet(doc, 470, yCachet, d.dateReservation.toLocaleDateString("fr-CA"));

    doc
      .fontSize(8)
      .fillColor(GRIS)
      .text(
        "Horizon 360 - Plateforme specialisee dans les visites virtuelles immersives.",
        50,
        780,
        { width: 495, align: "center" }
      );

    doc.end();
  });
}
