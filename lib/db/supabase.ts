import { getClassesForTown } from "@/app/lib/classes";

type SearchParams = {
  town?: string;
};

type BasicClass = {
  id: string;
  name: string;
  provider?: string;
  schedule?: string;
  description?: string;
  town?: string;
};

export async function searchClasses(params: SearchParams): Promise<BasicClass[]> {
  if (!params.town) {
    return [];
  }

  const classes = getClassesForTown(params.town) ?? [];

  return classes.map((item) => ({
    id: item.id,
    name: item.name,
    provider: item.provider,
    schedule: item.schedule,
    town: params.town,
  }));
}
