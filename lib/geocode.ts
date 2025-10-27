"server-only";

interface GeocodeResult {
  latitude: number | null;
  longitude: number | null;
  town: string | null;
  region: string | null;
}

export async function geocodePostcode(
  postcode: string | null | undefined
): Promise<GeocodeResult | null> {
  if (!postcode) return null;

  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) return null;
    const json = await response.json();
    const result = json?.result;
    if (!result) return null;

    return {
      latitude: typeof result.latitude === "number" ? result.latitude : null,
      longitude: typeof result.longitude === "number" ? result.longitude : null,
      town:
        typeof result.admin_district === "string"
          ? result.admin_district
          : typeof result.parish === "string"
            ? result.parish
            : null,
      region:
        typeof result.region === "string"
          ? result.region
          : typeof result.country === "string"
            ? result.country
            : null,
    };
  } catch (error) {
    console.warn("[geocode] postcode lookup failed", error);
    return null;
  }
}
