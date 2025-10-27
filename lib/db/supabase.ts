import { classesByTown, getClassesForTown } from "@/app/lib/classes";

type BasicClass = {
  id: string;
  name: string;
  provider?: string;
  schedule?: string;
  description?: string;
  town?: string;
};

export async function searchClasses(params: { town?: string } = {}): Promise<BasicClass[]> {
  if (params.town) {
    const classes = getClassesForTown(params.town) ?? [];
    return classes.map((item: any) => ({
      id: item.id,
      name: item.name,
      provider: item.provider,
      schedule: item.schedule,
      town: params.town,
    }));
  }

  const all = Object.entries(classesByTown).flatMap(([town, items]) =>
    (items as any[]).map((item) => ({
      id: item.id,
      name: item.name,
      provider: item.provider,
      schedule: item.schedule,
      town,
    }))
  );

  return all;
}
