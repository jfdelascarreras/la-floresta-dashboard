import type { ReactNode } from "react";

export function SectionBanner({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="relative -mx-4 -mt-4 mb-4 h-[110px] overflow-hidden md:-mx-8 md:-mt-6 md:mb-5 md:h-40">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-[center_40%]"
        style={{ backgroundImage: "url(/login-campo.webp)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#1c1915]/80 via-[#3a2a16]/50 to-[#1c1915]/25"
      />
      <div className="relative flex h-full items-end justify-between gap-3 px-4 pb-3 md:px-8 md:pb-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none text-[#fff8ee] md:text-4xl">{title}</h1>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-[#f6f1e8]/90 md:text-sm">{subtitle}</p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  );
}
