"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [enTransition, setEnTransition] = useState(false);

  useEffect(() => {
    const timerTransition = setTimeout(() => {
      setEnTransition(true);
    }, 2200);

    const timerCache = setTimeout(() => {
      setVisible(false);
    }, 2700);

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