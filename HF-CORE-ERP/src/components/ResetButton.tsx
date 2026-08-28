// ResetButton.tsx — botón moderno con efecto 3D sutil (sombra + gradiente),
// reutilizable donde se necesite una acción de "limpiar/reiniciar".

import { useState } from "react";

interface ResetButtonProps {
  onClick: () => void;
  label?: string;
}

export function ResetButton({ onClick, label = "Reiniciar" }: ResetButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 18px",
        fontSize: "14px",
        fontWeight: 600,
        borderRadius: "999px",
        border: "none",
        color: "#fff",
        background: "linear-gradient(145deg, #e57373, #c62828)",
        boxShadow: pressed
          ? "inset 0 2px 4px rgba(0,0,0,0.4)"
          : "0 4px 10px rgba(198,40,40,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        transform: pressed ? "translateY(1px)" : "translateY(0)",
        cursor: "pointer",
        transition: "all 0.12s ease",
      }}
    >
      <span style={{ fontSize: "16px" }}>↺</span>
      {label}
    </button>
  );
}
