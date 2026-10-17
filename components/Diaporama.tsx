"use client";

import { useEffect, useState } from "react";
import { imageOptimisee } from "@/lib/imageOptimisee";

interface DiaporamaProps {
  images: string[];
}

export default function Diaporama({ images }: DiaporamaProps) {
  const [indexActif, setIndexActif] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const intervalle = setInterval(() => {
      setIndexActif((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(intervalle);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      {images.map((image, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.9)), url(${imageOptimisee(image, 1200)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === indexActif ? 1 : 0,
            transition: "opacity 1.5s ease-in-out",
          }}
        />
      ))}
    </div>
  );
}