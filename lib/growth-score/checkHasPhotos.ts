/**
 * Helper function to check if a provider has at least one uploaded photo
 * Optimized to stop at the first photo found
 * 
 * @param supabase - Supabase server client
 * @param providerId - Provider ID to check
 * @returns Promise<boolean> - True if provider has at least 1 photo
 */
export async function checkProviderHasPhotos(
  supabase: ReturnType<typeof import("@/lib/supabase.server").getSupabaseServer>,
  providerId: number
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    // Optimized query: Only fetch classes that have images
    // Use exists check pattern - much faster than fetching all classes
    // We only need to know if ANY photo exists, not fetch all photos
    const { data: classWithImage, error } = await supabase
      .from("classes")
      .select("id")
      .eq("provider_id", providerId)
      .not("image_urls", "is", null)
      .limit(1)
      .maybeSingle();

    // If there's an error other than "no rows", log it
    if (error && error.code !== "PGRST116") {
      console.error("[checkProviderHasPhotos] Error:", error);
      return false;
    }

    // If we found a class with image_urls, we have photos
    if (classWithImage) {
      return true;
    }

    // Fallback: Check images table (for legacy data structure)
    // Only run this if image_urls check didn't find anything
    const { data: imageData } = await supabase
      .from("images")
      .select("id")
      .in(
        "class_id",
        supabase
          .from("classes")
          .select("id")
          .eq("provider_id", providerId)
      )
      .limit(1)
      .maybeSingle();

    return !!imageData;
  } catch (error) {
    console.error("[checkProviderHasPhotos] Error:", error);
    return false;
  }
}

