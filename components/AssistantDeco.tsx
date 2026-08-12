"use client";

import { useState } from "react";

interface AssistantDecoProps {
  contexte: string;
}

interface Message {
  role: "user" | "assistant";
  texte: string;
}

const questionsSuggerees = [
  "Comment disposer les meubles dans cette piece ?",
  "Quelle couleur de peinture irait bien ici ?",
  "Quel style de decoration conviendrait ?",
];

export default function AssistantDeco({ contexte }: AssistantDecoProps) {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function envoyerQuestion(texteQuestion: string) {
    if (!texteQuestion.trim()) return;

    setMessages((prev) => [...prev, { role: "user", texte: texteQuestion }]);
    setQuestion("");
    setEnCours(true);

    try {
      const res = await fetch("/api/conseil-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: texteQuestion, contexte }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", texte: data.reponse }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", texte: "Une erreur est survenue, reessaie." }]);
    }

    setEnCours(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    envoyerQuestion(question);
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 20,
          background: "#7c3aed",
          color: "white",
          border: "none",
          borderRadius: "999px",
          padding: "14px 20px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        Conseil deco IA
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 20,
        width: "340px",
        maxHeight: "480px",
        background: "#1e293b",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ background: "#7c3aed", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>Conseiller deco IA</span>
        <button onClick={() => setOuvert(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "16px" }}>X</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 && (
          <div>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "10px" }}>
              Pose une question sur l'amenagement ou la deco de cette piece.
            </p>
            {questionsSuggerees.map((q, i) => (
              <button
                key={i}
                onClick={() => envoyerQuestion(q)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  fontSize: "12px",
                  marginBottom: "6px",
                  cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#7c3aed" : "#334155",
              color: "white",
              padding: "8px 12px",
              borderRadius: "10px",
              fontSize: "13px",
              maxWidth: "85%",
            }}
          >
            {m.texte}
          </div>
        ))}

        {enCours && <p style={{ color: "#94a3b8", fontSize: "12px" }}>Reflexion en cours...</p>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", borderTop: "1px solid #334155", padding: "8px" }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ta question..."
          style={{ flex: 1, background: "#0f172a", border: "none", borderRadius: "8px", padding: "8px 10px", color: "white", fontSize: "13px" }}
        />
        <button
          type="submit"
          disabled={enCours}
          style={{ marginLeft: "8px", background: "#7c3aed", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", fontSize: "13px", cursor: "pointer" }}
        >
          →
        </button>
      </form>
    </div>
  );
}