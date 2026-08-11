"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMessagesContact, marquerMessageLu, supprimerMessageContact, MessageContact } from "@/lib/store";

export default function MessagesAdminPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageContact[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    async function charger() {
      const connecte = localStorage.getItem("admin_connecte");
      if (connecte !== "true") {
        router.push("/admin");
        return;
      }
      const m = await getMessagesContact();
      setMessages(m);
      setCharge(true);
    }
    charger();
  }, [router]);

  async function handleMarquerLu(id: string) {
    await marquerMessageLu(id);
    setMessages(await getMessagesContact());
  }

  async function handleSupprimer(id: string) {
    if (confirm("Supprimer ce message ?")) {
      await supprimerMessageContact(id);
      setMessages(await getMessagesContact());
    }
  }

  if (!charge) return <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">Chargement...</main>;

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
      <Link href="/admin/dashboard" className="mb-6 inline-block text-slate-400 hover:text-white">
        Retour au tableau de bord
      </Link>

      <h1 className="mb-8 text-3xl font-bold">Messages de contact ({messages.length})</h1>

      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.lu ? "rounded-xl bg-slate-800 p-5 opacity-60" : "rounded-xl bg-slate-800 p-5 border-l-4 border-blue-500"}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{msg.nom}</p>
              <div className="flex gap-2">
                {!msg.lu && (
                  <button onClick={() => handleMarquerLu(msg.id)} className="rounded-lg bg-blue-600 px-3 py-1 text-xs hover:bg-blue-700">
                    Marquer comme lu
                  </button>
                )}
                <button onClick={() => handleSupprimer(msg.id)} className="rounded-lg bg-red-600 px-3 py-1 text-xs hover:bg-red-700">
                  Supprimer
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-400">{msg.email} {msg.telephone && "- " + msg.telephone}</p>
            <p className="mt-2 text-slate-300">{msg.message}</p>
          </div>
        ))}
      </div>

      {messages.length === 0 && <p className="text-slate-400">Aucun message pour l'instant.</p>}
    </main>
  );
}