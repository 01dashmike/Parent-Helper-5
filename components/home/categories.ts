export type HomepageCategory = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
};

export const HOMEPAGE_CATEGORIES: HomepageCategory[] = [
  {
    slug: "arts-crafts",
    title: "Arts & Crafts",
    description: "Creative workshops filled with painting, sticking, and sensory fun.",
    tags: ["Creative", "Hands-on"],
    image: "/images/categories/arts.webp",
  },
  {
    slug: "music-movement",
    title: "Music & Movement",
    description: "Sing-alongs, rhythm games, and percussion circles for joyful movers.",
    tags: ["Baby choirs", "Toddler bands"],
    image: "/images/categories/music.webp",
  },
  {
    slug: "baby-yoga",
    title: "Baby Yoga",
    description: "Stretch, balance, and bond with guided parent-and-child flows.",
    tags: ["Mindful movement", "Parent-child"],
    image: "/images/categories/yoga.webp",
  },
  {
    slug: "drama-play",
    title: "Drama & Play",
    description: "Role-play adventures that build imagination and confidence.",
    tags: ["Confidence boost", "Small groups"],
    image: "/images/categories/dance.webp",
  },
  {
    slug: "outdoor-play",
    title: "Outdoor Play",
    description: "Forest school sessions, buggy hikes, and open-air adventures.",
    tags: ["Nature trails", "Fresh air"],
    image: "/images/categories/outdoor.webp",
  },
  {
    slug: "postnatal-wellness",
    title: "Postnatal Wellness",
    description: "Gentle fitness and recovery support for brand-new parents.",
    tags: ["Rebuild core", "Mother & baby"],
    image: "/images/categories/postnatal.webp",
  },
  {
    slug: "storytime",
    title: "Storytime",
    description: "Captivating tales and sing-song rhymes to spark early literacy.",
    tags: ["Reading fun", "Language growth"],
    image: "/images/categories/storytime.webp",
  },
  {
    slug: "kids-photography",
    title: "Kids Photography",
    description: "Warm, candid photo sessions that capture milestone magic.",
    tags: ["Photo shoots", "Milestones"],
    image: "/images/categories/photographer.webp",
  },
  {
    slug: "mindfulness",
    title: "Mindfulness",
    description: "Calming breathwork, stretches, and zen-focused mini moments.",
    tags: ["Relaxation", "Focus"],
    image: "/images/categories/stem.webp",
  },
];

