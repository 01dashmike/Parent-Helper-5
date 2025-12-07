import { cityToSlug, TOP_UK_CITIES } from './cities';
import { isCityPagesEnabled, isPersonalizationEnabled } from './env';

/**
 * Find the nearest city slug from a location string
 */
export function findNearestCitySlug(location: string | null): string | null {
  if (!isCityPagesEnabled() || !isPersonalizationEnabled() || !location) {
    return null;
  }

  const locationLower = location.toLowerCase().trim();

  // Try exact match first
  for (const citySlug of TOP_UK_CITIES) {
    const cityName = citySlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (locationLower === cityName.toLowerCase() || locationLower === citySlug) {
      return citySlug;
    }
  }

  // Try partial match
  for (const citySlug of TOP_UK_CITIES) {
    const cityName = citySlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (
      locationLower.includes(cityName.toLowerCase()) ||
      cityName.toLowerCase().includes(locationLower)
    ) {
      return citySlug;
    }
  }

  // Try converting location to slug and matching
  const locationSlug = cityToSlug(location);
  if (TOP_UK_CITIES.includes(locationSlug as any)) {
    return locationSlug;
  }

  return null;
}

/**
 * Get city redirect URL if location is detected
 */
export function getCityRedirectUrl(location: string | null): string | null {
  const citySlug = findNearestCitySlug(location);
  return citySlug ? `/city/${citySlug}` : null;
}

