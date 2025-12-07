import type { ClassResult } from "@/components/search/SearchPageClient";

type DemoClass = Pick<
    ClassResult,
    | "id"
    | "title"
    | "description"
    | "latitude"
    | "longitude"
    | "category"
    | "town"
    | "age_range"
    | "featured"
    | "searchScore"
>;

type TownConfig = {
    name: string;
    slug: string;
    baseLat: number;
    baseLng: number;
    total: number;
};

type Template = {
    titlePrefix: string;
    category: string;
    ageRange: string;
    description: string;
    keyword: string;
};

const towns: TownConfig[] = [
    { name: "London", slug: "london", baseLat: 51.5074, baseLng: -0.1278, total: 34 },
    { name: "Bristol", slug: "bristol", baseLat: 51.4545, baseLng: -2.5879, total: 33 },
    { name: "Manchester", slug: "manchester", baseLat: 53.4808, baseLng: -2.2426, total: 33 },
];

const templates: Template[] = [
    {
        titlePrefix: "Music Makers",
        category: "Music & Rhythm",
        ageRange: "0-3 years",
        description: "Joyful sing-alongs with percussion play and sensory scarves.",
        keyword: "music",
    },
    {
        titlePrefix: "Mini Dancers",
        category: "Dance & Movement",
        ageRange: "2-5 years",
        description: "Creative movement with ribbons, balance paths, and storytelling.",
        keyword: "dance",
    },
    {
        titlePrefix: "Sensory Explorers",
        category: "Sensory & Messy Play",
        ageRange: "0-2 years",
        description: "Gentle sensory trays, light play, and tactile textures to discover.",
        keyword: "sensory",
    },
    {
        titlePrefix: "Storytime Adventures",
        category: "Storytelling",
        ageRange: "0-4 years",
        description: "Interactive tales with puppets, sound buckets, and rhyme time.",
        keyword: "story",
    },
    {
        titlePrefix: "STEM Sprouts",
        category: "STEM & Curiosity",
        ageRange: "3-6 years",
        description: "Early science experiments with magnets, circuits, and water play.",
        keyword: "science",
    },
    {
        titlePrefix: "Outdoor Pioneers",
        category: "Outdoor Adventures",
        ageRange: "1-5 years",
        description: "Mini forest school sessions with nature crafts and campfire songs.",
        keyword: "outdoor",
    },
    {
        titlePrefix: "Little Chefs",
        category: "Food & Nutrition",
        ageRange: "3-6 years",
        description: "Hands-on cooking classes exploring seasonal ingredients safely.",
        keyword: "cooking",
    },
    {
        titlePrefix: "Mindful Minis",
        category: "Wellbeing & Yoga",
        ageRange: "2-7 years",
        description: "Calming breathing, kid-friendly yoga flows, and gratitude circles.",
        keyword: "yoga",
    },
    {
        titlePrefix: "Creative Crafters",
        category: "Arts & Crafts",
        ageRange: "3-8 years",
        description: "Open-ended art projects with eco-friendly materials and clay play.",
        keyword: "craft",
    },
    {
        titlePrefix: "Sports Stars",
        category: "Active Play",
        ageRange: "4-8 years",
        description: "Movement circuits, teamwork games, and coordination challenges.",
        keyword: "sports",
    },
];

const safeNumber = (value: number) => Number(value.toFixed(6));

const buildDemoClasses = (): DemoClass[] => {
    const records: DemoClass[] = [];

    towns.forEach((town, townIndex) => {
        for (let index = 0; index < town.total; index += 1) {
            const template = templates[index % templates.length];
            const variation = Math.floor(index / templates.length) + 1;

            const latOffset = ((index % 6) - 2) * 0.003;
            const lngOffset = (Math.floor(index / 6) - 2) * 0.004;

            const latitude = safeNumber(town.baseLat + latOffset * 0.6);
            const longitude = safeNumber(town.baseLng + lngOffset * 0.6);

            const demoIndex = townIndex * 100 + index;
            const isFeatured = (demoIndex + town.total) % 4 === 0;
            const featuredFlags = isFeatured
                ? {
                    isBoosted: (demoIndex + 1) % 8 === 0,
                    hasPlan: true,
                    planSlug: "growth-plus",
                    budgetOk: true,
                    windowActive: true,
                    listingStatus: "active",
                }
                : null;

            records.push({
                id: `demo-${town.slug}-${String(index + 1).padStart(2, "0")}`,
                title: `${template.titlePrefix} ${variation} – ${town.name}`,
                description: `${template.description} Families in ${town.name} love these ${template.keyword} sessions for their welcoming, community-first feel.`,
                latitude,
                longitude,
                category: template.category,
                town: town.name,
                age_range: template.ageRange,
                searchScore: Math.max(50, 480 - demoIndex),
                featured: featuredFlags,
            });
        }
    });

    return records;
};

export const demoClasses: DemoClass[] = buildDemoClasses();

