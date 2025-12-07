import { createClient } from '@/lib/supabase/server';
import { isCityPagesEnabled } from '@/lib/env';
import { NATIONAL_POPULAR_CATEGORIES } from './cities';

export type CityClass = {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    town: string | null;
    venue: string | null;
    address: string | null;
    postcode: string | null;
    latitude: number | null;
    longitude: number | null;
    price: string | null;
    ageGroupMin: number | null;
    ageGroupMax: number | null;
    providerName: string | null;
    providerWebsite: string | null;
    imageUrl: string | null;
    featured: boolean;
};

export type CityPageData = {
    city: string;
    citySlug: string;
    popularClasses: CityClass[];
    featuredClasses: CityClass[];
    hasLocalData: boolean;
};

/**
 * Get popular classes for a city (ordered by bookings_count or popularity)
 */
export async function getPopularClassesForCity(
    citySlug: string,
    limit: number = 6
): Promise<CityClass[]> {
    if (!isCityPagesEnabled()) {
        return [];
    }

    const supabase = createClient();
    const cityName = citySlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // Query classes in this city, ordered by current_bookings or popularity
    // Note: Using current_bookings as bookings_count may not exist in schema
    // Query classes matching city name in town or additional_towns
    const { data, error } = await supabase
        .from('classes')
        .select(
            `
      id,
      name,
      description,
      category,
      town,
      venue,
      address,
      postcode,
      latitude,
      longitude,
      price,
      age_group_min,
      age_group_max,
      provider_name,
      website,
      image_urls,
      is_featured,
      current_bookings,
      popularity,
      review_count
    `
        )
        .ilike('town', `%${cityName}%`)
        .eq('is_active', true)
        .order('current_bookings', { ascending: false, nullsFirst: false })
        .order('popularity', { ascending: false, nullsFirst: false })
        .limit(limit);

    if (error) {
        console.error(`[city-data] Error fetching popular classes for ${citySlug}:`, error);
        return [];
    }

    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        town: item.town,
        venue: item.venue,
        address: item.address,
        postcode: item.postcode,
        latitude: item.latitude ? parseFloat(item.latitude) : null,
        longitude: item.longitude ? parseFloat(item.longitude) : null,
        price: item.price,
        ageGroupMin: item.age_group_min,
        ageGroupMax: item.age_group_max,
        providerName: item.provider_name,
        providerWebsite: item.website,
        imageUrl: Array.isArray(item.image_urls) && item.image_urls.length > 0
            ? item.image_urls[0]
            : null,
        featured: item.is_featured || false,
    }));
}

/**
 * Get featured classes for a city (where featured_ends_at > now)
 */
export async function getFeaturedClassesForCity(
    citySlug: string,
    limit: number = 6
): Promise<CityClass[]> {
    if (!isCityPagesEnabled()) {
        return [];
    }

    const supabase = createClient();
    const cityName = citySlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('classes')
        .select(
            `
      id,
      name,
      description,
      category,
      town,
      venue,
      address,
      postcode,
      latitude,
      longitude,
      price,
      age_group_min,
      age_group_max,
      provider_name,
      website,
      image_urls,
      is_featured,
      featured_ends_at,
      featured_priority
    `
        )
        .ilike('town', `%${cityName}%`)
        .eq('is_active', true)
        .eq('is_featured', true)
        .gt('featured_ends_at', now)
        .order('featured_priority', { ascending: false })
        .order('featured_ends_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error(`[city-data] Error fetching featured classes for ${citySlug}:`, error);
        return [];
    }

    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        town: item.town,
        venue: item.venue,
        address: item.address,
        postcode: item.postcode,
        latitude: item.latitude ? parseFloat(item.latitude) : null,
        longitude: item.longitude ? parseFloat(item.longitude) : null,
        price: item.price,
        ageGroupMin: item.age_group_min,
        ageGroupMax: item.age_group_max,
        providerName: item.provider_name,
        providerWebsite: item.website,
        imageUrl: Array.isArray(item.image_urls) && item.image_urls.length > 0
            ? item.image_urls[0]
            : null,
        featured: true,
    }));
}

/**
 * Get all data for a city page
 */
export async function getCityPageData(citySlug: string): Promise<CityPageData> {
    const cityName = citySlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const [popularClasses, featuredClasses] = await Promise.all([
        getPopularClassesForCity(citySlug, 6),
        getFeaturedClassesForCity(citySlug, 6),
    ]);

    const hasLocalData = popularClasses.length > 0 || featuredClasses.length > 0;

    return {
        city: cityName,
        citySlug,
        popularClasses,
        featuredClasses,
        hasLocalData,
    };
}

/**
 * Get fallback classes (national popular seed)
 */
export function getFallbackClasses(): CityClass[] {
    return NATIONAL_POPULAR_CATEGORIES.map((category, index) => ({
        id: index + 10000, // Temporary IDs
        name: `${category} Classes`,
        description: `Discover ${category.toLowerCase()} classes for babies and toddlers.`,
        category,
        town: null,
        venue: null,
        address: null,
        postcode: null,
        latitude: null,
        longitude: null,
        price: 'From £5',
        ageGroupMin: 0,
        ageGroupMax: 60,
        providerName: null,
        providerWebsite: null,
        imageUrl: null,
        featured: false,
    }));
}

