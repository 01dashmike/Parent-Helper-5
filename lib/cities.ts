/**
 * Top 100 UK cities by population
 * Used for static generation of city landing pages
 */
export const TOP_UK_CITIES = [
    'london',
    'birmingham',
    'manchester',
    'glasgow',
    'liverpool',
    'leeds',
    'edinburgh',
    'bristol',
    'cardiff',
    'sheffield',
    'belfast',
    'leicester',
    'coventry',
    'nottingham',
    'newcastle-upon-tyne',
    'southampton',
    'derby',
    'portsmouth',
    'brighton',
    'reading',
    'northampton',
    'luton',
    'bolton',
    'bournemouth',
    'norwich',
    'swansea',
    'swindon',
    'southend-on-sea',
    'middlesbrough',
    'peterborough',
    'cambridge',
    'oxford',
    'ipswich',
    'colchester',
    'crawley',
    'doncaster',
    'preston',
    'blackpool',
    'milton-keynes',
    'southport',
    'york',
    'watford',
    'exeter',
    'southampton',
    'worcester',
    'guildford',
    'hastings',
    'eastbourne',
    'blackburn',
    'basildon',
    'warrington',
    'wigan',
    'oldham',
    'salford',
    'rochdale',
    'stockport',
    'trafford',
    'woking',
    'maidstone',
    'canterbury',
    'tunbridge-wells',
    'chelmsford',
    'brentwood',
    'romford',
    'dartford',
    'gravesend',
    'croydon',
    'kingston-upon-thames',
    'richmond',
    'harrow',
    'ealing',
    'hammersmith',
    'fulham',
    'kensington',
    'chelsea',
    'westminster',
    'camden',
    'islington',
    'hackney',
    'tower-hamlets',
    'greenwich',
    'lewisham',
    'southwark',
    'lambeth',
    'wandsworth',
    'merton',
    'kingston',
    'sutton',
    'bromley',
    'bexley',
    'havering',
    'barking',
    'redbridge',
    'newham',
    'waltham-forest',
    'haringey',
    'enfield',
    'barnet',
    'harrow',
    'hillingdon',
] as const;

/**
 * Convert city name to slug
 */
export function cityToSlug(city: string): string {
    return city
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Convert slug back to city name
 */
export function slugToCity(slug: string): string {
    return slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * National popular class categories (fallback when city has no data)
 */
export const NATIONAL_POPULAR_CATEGORIES = [
    'Music & Movement',
    'Baby Yoga',
    'Sensory Play',
    'Swimming',
    'Arts & Crafts',
    'Storytime',
] as const;

