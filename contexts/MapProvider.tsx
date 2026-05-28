"use client";
import { ReactNode } from "react";
import { SkeletonForTopPlacesToVisit } from "@/components/sections/TopPlacesToVisit";

// Simplified MapProvider - no Google Maps SDK needed (using Leaflet instead)
export function MapProvider({ children, isLoading }: { children: ReactNode; isLoading: boolean }) {
  if (isLoading) return <SkeletonForTopPlacesToVisit isMaps />;
  return children;
}
