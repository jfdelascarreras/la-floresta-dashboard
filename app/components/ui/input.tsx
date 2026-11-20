import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

const field =
  "min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none ring-forest/30 placeholder:text-muted focus:ring-2";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${field} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${field} ${props.className ?? ""}`} />;
}
