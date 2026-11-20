"use client";

import { useState, type InputHTMLAttributes } from "react";

import { Input } from "@/app/components/ui/input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** Campo de clave con botón para mostrar u ocultar lo que se escribe. */
export function PasswordInput({ className, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className ?? ""}`}>
      <Input {...props} type={visible ? "text" : "password"} className="pr-24" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex min-w-20 items-center justify-center rounded-r-xl px-3 text-xs font-semibold text-forest hover:bg-forest/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
