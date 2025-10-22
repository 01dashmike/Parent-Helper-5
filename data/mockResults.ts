export interface SearchResult {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  lat: number;
  lng: number;
  distanceKm: number;
  category: string;
}

export const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "Winchester Baby Sensory",
    description: "Interactive sensory sessions designed for babies 0-12 months.",
    imageUrl: "/images/placeholder.jpg",
    lat: 51.0632,
    lng: -1.308,
    distanceKm: 1.2,
    category: "Baby & Toddler",
  },
  {
    id: "2",
    title: "Forest Explorers Club",
    description: "Outdoor woodland adventures encouraging confidence and curiosity.",
    imageUrl: "/images/placeholder.jpg",
    lat: 51.0704,
    lng: -1.3139,
    distanceKm: 2.5,
    category: "Outdoor",
  },
  {
    id: "3",
    title: "Little Musicians Workshop",
    description: "Introduce your child to instruments with a playful group session.",
    imageUrl: "/images/placeholder.jpg",
    lat: 51.0771,
    lng: -1.321,
    distanceKm: 3.8,
    category: "Music",
  },
  {
    id: "4",
    title: "Creative Tots Art Club",
    description: "Mess-friendly art classes focused on creativity and fine motor skills.",
    imageUrl: "/images/placeholder.jpg",
    lat: 51.0871,
    lng: -1.3404,
    distanceKm: 4.2,
    category: "Arts & Crafts",
  },
  {
    id: "5",
    title: "Junior Coding Lab",
    description: "STEM coding club for curious minds aged 7-11.",
    imageUrl: "/images/placeholder.jpg",
    lat: 51.0659,
    lng: -1.3305,
    distanceKm: 2.1,
    category: "STEM",
  },
  {
    id: "6",
    title: "Family Yoga Winchester",
    description: "Mindful movement sessions for parents and children together.",
    imageUrl: "/images/placeholder.jpg",
    lat: 51.051,
    lng: -1.325,
    distanceKm: 5.5,
    category: "Wellbeing",
  },
  {
    id: "7",
    title: "Saturday Sports Squad",
    description: "Multi-sport fun building teamwork and coordination.",
    imageUrl: "/images/placeholder.jpg",
    lat: 51.0603,
    lng: -1.3458,
    distanceKm: 4.9,
    category: "Sports",
  },
  {
    id: "8",
    title: "Online Storytime Circle",
    description: "Virtual story adventures perfect for rainy afternoons.",
    imageUrl: "/images/placeholder.jpg",
    lat: 51.0632,
    lng: -1.308,
    distanceKm: 0,
    category: "Online",
  },
];
