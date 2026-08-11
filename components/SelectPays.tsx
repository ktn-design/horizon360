"use client";

import { listePays } from "@/data/pays";

interface SelectPaysProps {
  value: string;
  onChange: (pays: string) => void;
  className?: string;
}

export default function SelectPays({ value, onChange, className }: SelectPaysProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className || "input"}
      style={{ backgroundColor: "#334155", color: "#ffffff" }}
    >
      <option value="" style={{ backgroundColor: "#334155", color: "#ffffff" }}>Tous les pays</option>
      {listePays.map((pays) => (
        <option key={pays} value={pays} style={{ backgroundColor: "#334155", color: "#ffffff" }}>
          {pays}
        </option>
      ))}
    </select>
  );
}