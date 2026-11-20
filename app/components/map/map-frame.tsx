"use client";

import dynamic from "next/dynamic";

import type { LotMapProps } from "@/app/components/map/lot-map";

const LotMap = dynamic(() => import("@/app/components/map/lot-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#efe6d4]" />,
});

export function MapFrame(props: LotMapProps) {
  return <LotMap {...props} />;
}
