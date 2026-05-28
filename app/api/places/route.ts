import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// GET /api/places?input=london           → autocomplete predictions
// GET /api/places?placeId=ChIJ...        → place details (lat/lng/name)
export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input");
  const placeId = req.nextUrl.searchParams.get("placeId");

  if (placeId) {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,geometry&key=${API_KEY}`
    );
    const data = await res.json();
    return NextResponse.json({ result: data.result || null });
  }

  if (input) {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${API_KEY}`
    );
    const data = await res.json();
    return NextResponse.json({ predictions: data.predictions || [] });
  }

  return NextResponse.json({ predictions: [] });
}
