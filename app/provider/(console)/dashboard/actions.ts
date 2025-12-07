"use server";

type UpcomingOccurrence = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  classes: { title: string | null } | null;
  venues: { name: string | null } | null;
};

/**
 * Server action: Process and format upcoming occurrences
 * Moved from client component to reduce client-side computation
 */
export async function processUpcomingOccurrences(
  occurrences: UpcomingOccurrence[]
): Promise<
  Array<{
    id: string;
    title: string;
    venue: string;
    starts_at: string;
    ends_at: string | null;
    status: string;
    formattedStart: string;
    formattedEnd: string | null;
  }>
> {
  if (!Array.isArray(occurrences)) return [];

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return occurrences.map((occurrence) => {
    const startDate = new Date(occurrence.starts_at);
    const endDate = occurrence.ends_at ? new Date(occurrence.ends_at) : null;

    return {
      id: occurrence.id,
      title: occurrence.classes?.title ?? "Untitled class",
      venue: occurrence.venues?.name ?? "No venue",
      starts_at: occurrence.starts_at,
      ends_at: occurrence.ends_at,
      status: occurrence.status,
      formattedStart: dateFormatter.format(startDate),
      formattedEnd: endDate ? dateFormatter.format(endDate) : null,
    };
  });
}

