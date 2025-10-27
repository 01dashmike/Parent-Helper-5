import { ClassDetailClient } from "./ClassDetailClient";

type ParamsPromise = Promise<{ id: string }>;

export default async function ClassDetailPage({ params }: { params?: ParamsPromise }) {
  const resolvedParams = (await (params ?? Promise.resolve({ id: "" }))) as { id: string };
  return <ClassDetailClient classId={resolvedParams.id} />;
}
