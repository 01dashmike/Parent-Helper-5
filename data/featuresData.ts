export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
  link?: string;
  gradient?: string;
}

export const features: FeatureItem[] = [
  {
    title: 'Baby & Toddler',
    description: 'Fun classes to bond and learn through play.',
    icon: '/icons/baby.svg',
    link: '/classes/baby-toddler',
    gradient: 'from-brand-sage/80 via-white to-brand-cream',
  },
  {
    title: 'After School Clubs',
    description: 'Find enriching clubs for children of all ages.',
    icon: '/icons/school.svg',
    link: '/after-school-clubs',
    gradient: 'from-brand-coral/30 via-white to-brand-cream',
  },
  {
    title: 'Photography & Keepsakes',
    description: 'Capture precious memories with local photographers.',
    icon: '/icons/camera.svg',
    link: '/photography-keepsakes',
    gradient: 'from-brand-lavender/40 via-white to-brand-cream',
  },
  {
    title: 'Parent Support Groups',
    description: 'Meet other parents and join local support networks.',
    icon: '/icons/community.svg',
    link: '/parent-support-groups',
    gradient: 'from-brand-cream via-white to-brand-sage/60',
  },
];
