"use client";

import { useEffect, useState } from "react";

const CLE_SESSION = "horizon360_splash_vu";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [enTransition, setEnTransition] = useState(false);

  useEffect(() => {
    let dejaVu = false;
    try {
      dejaVu = sessionStorage.getItem(CLE_SESSION) === "true";
    } catch {
      dejaVu = false;
    }

    if (dejaVu) {
      setVisible(false);
      return;
    }

    try {
      sessionStorage.setItem(CLE_SESSION, "true");
    } catch {
      // sessionStorage indisponible (navigation privee, etc.) : pas grave, le splash reapparaitra simplement
    }

    const timerTransition = setTimeout(() => {
      setEnTransition(true);
    }, 700);

    const timerCache = setTimeout(() => {
      setVisible(false);
    }, 1100);

    return () => {
      clearTimeout(timerTransition);
      clearTimeout(timerCache);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: enTransition ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        pointerEvents: enTransition ? "none" : "auto",
      }}
    >
      <img
        src="/rev.png"
        alt="Revival"
        style={{ width: "160px", height: "160px", objectFit: "contain" }}
      />
      <p
        style={{
          marginTop: "16px",
          color: "#dc2626",
          fontSize: "16px",
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}
      >
        Powered by Revival
      </p>
    </div>
  );
}
