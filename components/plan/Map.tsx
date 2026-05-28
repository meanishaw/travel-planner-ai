"use client";
import { Doc } from "@/convex/_generated/dataModel";
import { colors } from "@/lib/constants";
import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type MapProps = {
  topPlacesToVisit: (Doc<"plan">["topplacestovisit"][number] & { id: string })[] | undefined;
  selectedPlace: { lat: number; lng: number } | undefined;
};

export default function Map({ topPlacesToVisit, selectedPlace }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);

  // Initialize map once on mount
  useEffect(() => {
    if (!mapRef.current) return;

    let map: any;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      LRef.current = L;

      // Fix default icon issue with webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(mapRef.current!, { zoomControl: true });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Render initial places if available
      if (topPlacesToVisit?.length) {
        renderMarkers(L, map, topPlacesToVisit);
      } else {
        map.setView([20, 0], 2);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const renderMarkers = (L: any, map: any, places: NonNullable<typeof topPlacesToVisit>) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((place, index) => {
      const color = colors[index % 6];
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:4px solid white;box-shadow:2px 2px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-weight:bold;font-size:12px">${index + 1}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([place.coordinates.lat, place.coordinates.lng], { icon }).addTo(map);
      marker.bindPopup(`<b>${place.name}</b>`);
      markersRef.current.push(marker);
    });

    const bounds = L.latLngBounds(places.map((p) => [p.coordinates.lat, p.coordinates.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  // Update markers when places change
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current || !topPlacesToVisit?.length) return;
    renderMarkers(LRef.current, mapInstanceRef.current, topPlacesToVisit);
  }, [topPlacesToVisit]);

  // Pan to selected place
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlace) return;
    mapInstanceRef.current.setView([selectedPlace.lat, selectedPlace.lng], 14, { animate: true });
  }, [selectedPlace]);

  if (!topPlacesToVisit?.length) {
    return (
      <div className="w-full h-full flex flex-col gap-2 justify-center items-center bg-background text-balance px-2 text-center">
        <MapPin className="h-20 w-20" />
        <span>Search and select a location to add to places to visit</span>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[30rem] rounded-md overflow-hidden"
    />
  );
}
