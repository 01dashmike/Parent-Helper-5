export const classesByTown = {
  london: [
    {
      id: 'london-1',
      name: 'Sensory Sing & Play',
      provider: 'Little Explorers Collective',
      schedule: 'Mondays & Thursdays at 10:00',
    },
    {
      id: 'london-2',
      name: 'Mini Movers Dance Lab',
      provider: 'Southbank Dance Hub',
      schedule: 'Wednesdays at 11:30',
    },
  ],
  manchester: [
    {
      id: 'manchester-1',
      name: 'Nature Tots Forest School',
      provider: 'Peak & Valley Outdoors',
      schedule: 'Saturdays at 09:30',
    },
    {
      id: 'manchester-2',
      name: 'STEM Sprouts Tinker Time',
      provider: 'Northern Makers Lab',
      schedule: 'Tuesdays at 13:00',
    },
  ],
  bristol: [
    {
      id: 'bristol-1',
      name: 'Wildlings Eco Playgroup',
      provider: 'Bristol Green Play',
      schedule: 'Fridays at 10:30',
    },
    {
      id: 'bristol-2',
      name: 'Mini Mariners Water Safety',
      provider: 'Harbourside Swim School',
      schedule: 'Sundays at 11:00',
    },
  ],
};

export function getClassesForTown(town) {
  if (!town) return null;
  return classesByTown[town.toLowerCase()] ?? null;
}

export function getSupportedTowns() {
  return Object.keys(classesByTown);
}
