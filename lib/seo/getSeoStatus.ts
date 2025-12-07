/**
 * Determine SEO status for a class based on metadata presence
 * Returns: 'ready' | 'missing' | 'outdated'
 */

type ClassMetadata = {
  meta_title?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export function getSeoStatus(classItem: ClassMetadata): "ready" | "missing" | "outdated" {
  // Check if all metadata fields are present
  const hasAllMetadata =
    classItem.meta_title &&
    classItem.meta_description &&
    classItem.keywords &&
    classItem.keywords.length > 0;

  if (!hasAllMetadata) {
    return "missing";
  }

  // Check if metadata is outdated (older than 90 days)
  const updatedAt = classItem.updated_at || classItem.created_at;
  if (updatedAt) {
    const updatedDate = new Date(updatedAt);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    if (updatedDate < ninetyDaysAgo) {
      return "outdated";
    }
  }

  return "ready";
}

