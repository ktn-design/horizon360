// Interrupteurs des fonctionnalites du site (et donc de l'application mobile, qui affiche le site).

// Section Hotels (pages /hotels et /chambres, menu, accueil, recherche) masquee aux clients
// tant qu'aucun paiement en ligne utilisable en RDC n'est en place. L'administration des
// hotels et des chambres reste accessible pour preparer le catalogue.
export const HOTELS_VISIBLES = false;

// Paiement en ligne par carte (Stripe, en mode test : non disponible en RDC). Desactive :
// seul « Payer sur place » est propose pour les salles (et les hotels une fois reaffiches).
// A reactiver avec le nouveau moyen de paiement (ex. Equity BCDC Easy e-commerce).
export const PAIEMENT_EN_LIGNE_ACTIF = false;
