import { NextRequest, NextResponse } from "next/server";

// Uses Geoapify Places API - free tier, no billing required
// Sign up free at https://www.geoapify.com/ to get an API key
// Free tier: 3000 requests/day - more than enough

const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input");
  const placeId = req.nextUrl.searchParams.get("placeId");

  if (placeId) {
    // placeId is "lat,lng,name" encoded — decode and return
    try {
      const decoded = JSON.parse(Buffer.from(placeId, "base64").toString("utf-8"));
      return NextResponse.json({ result: decoded });
    } catch {
      return NextResponse.json({ result: null });
    }
  }

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&type=city&limit=6&apiKey=${GEOAPIFY_KEY}`
    );
    const data = await res.json();

    // Transform to match Google Places prediction format
    const predictions = (data.features || []).map((feature: any) => {
      const props = feature.properties;
      const name = [props.city || props.name, props.state, props.country]
        .filter(Boolean)
        .join(", ");
      const lat = props.lat;
      const lng = props.lon;
      // Encode lat/lng/name into placeId so we don't need a second API call
      const encodedId = Buffer.from(JSON.stringify({ lat, lng, name: props.city || props.name })).toString("base64");
      return {
        place_id: encodedId,
        description: name,
      };
    });

    return NextResponse.json({ predictions });
  } catch (err) {
    console.error("Geoapify error:", err);
    return NextResponse.json({ predictions: [] });
  }
}
