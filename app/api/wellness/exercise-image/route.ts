import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for exercise images from various exercise APIs.
 * Supports ExerciseDB (via exerciseId parameter), workoutapi.com, and legacy gym-fit.
 * Images may require API key authentication, so we fetch them server-side
 * and serve them to the browser.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const exerciseId = searchParams.get("exerciseId");
  const imageUrl = searchParams.get("url");

  const apiKey = process.env.RAPIDAPI_KEY;

  // Handle ExerciseDB request via exerciseId parameter
  if (exerciseId) {
    if (!apiKey) {
      return NextResponse.json(
        { error: "RAPIDAPI_KEY not configured" },
        { status: 500 }
      );
    }

    try {
      const resolution = searchParams.get("resolution") || "360";
      const exerciseDbUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=${resolution}`;

      const response = await fetch(exerciseDbUrl, {
        headers: {
          "x-rapidapi-host": "exercisedb.p.rapidapi.com",
          "x-rapidapi-key": apiKey.trim(),
          "Accept": "image/gif",
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`ExerciseDB image error for ${exerciseId}:`, response.status, errorText);
        return NextResponse.json(
          { error: "Failed to fetch exercise GIF", status: response.status },
          { status: response.status }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    } catch (error) {
      console.error("Error fetching ExerciseDB image:", error);
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 500 }
      );
    }
  }

  // Handle legacy URL-based requests (for workoutapi.com and gym-fit)
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing exerciseId or url parameter" },
      { status: 400 }
    );
  }

  // Validate allowed image sources for security
  const isExerciseDB = imageUrl.includes("exercisedb") || 
                       imageUrl.includes("v2.p.rapidapi.com");
  const isWorkoutAPI = imageUrl.includes("workoutapi.com");
  const isGymFit = imageUrl.includes("gymfit-api.com") || 
                   imageUrl.includes("gym-fit") || 
                   imageUrl.includes("gym-fit.s3");
  
  if (!isExerciseDB && !isWorkoutAPI && !isGymFit) {
    return NextResponse.json(
      { error: "Invalid image URL - only exercisedb, workoutapi.com and gym-fit images allowed" },
      { status: 400 }
    );
  }

  // Determine which API key to use
  const apiKeyToUse = isWorkoutAPI 
    ? process.env.WORKOUTAPI_KEY 
    : process.env.RAPIDAPI_KEY;

  if (!apiKeyToUse) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    // For ExerciseDB GIFs, accept GIF format first
    // For other sources, try PNG first, then fallback to SVG, then any image type
    const acceptHeaders = isExerciseDB
      ? ["image/gif", "image/*"]
      : ["image/png", "image/svg+xml", "image/*"];
    
    let response: Response | null = null;
    let lastError: Error | null = null;
    
    for (const accept of acceptHeaders) {
      try {
        // Build headers based on API type
        const headers: HeadersInit = {
          "Accept": accept,
        };
        
        if (isWorkoutAPI) {
          headers["x-api-key"] = apiKeyToUse.trim();
        }
        
        // ExerciseDB requires RapidAPI headers
        if (isExerciseDB && apiKeyToUse) {
          headers["x-rapidapi-host"] = "exercisedb.p.rapidapi.com";
          headers["x-rapidapi-key"] = apiKeyToUse.trim();
        }
        
        // Gym-Fit S3 URLs don't need API headers - they're signed public URLs
        
        response = await fetch(imageUrl, {
          headers,
          cache: "force-cache", // Cache the response
        });
        
        if (response.ok) {
          break; // Success, use this response
        }
        
        // If 404, don't try other formats - endpoint doesn't exist
        if (response.status === 404) {
          break;
        }
      } catch (err) {
        lastError = err as Error;
        continue; // Try next format
      }
    }
    
    if (!response) {
      throw lastError || new Error("Failed to fetch image");
    }

    if (!response.ok) {
      // Log detailed error for debugging
      const errorText = await response.text().catch(() => "");
      console.error(`Failed to fetch image from ${imageUrl}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      // If 404, the illustration endpoint may not be available (could be premium or not implemented)
      // Return a 404 so the frontend can handle it gracefully
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: "Illustration not available",
            details: errorText || "Endpoint returned 404",
            url: imageUrl,
          },
          { status: 404 }
        );
      }
      
      // If 403, likely hotlink protection
      if (response.status === 403) {
        return NextResponse.json(
          { 
            error: "Image access forbidden (hotlink protection)",
            details: errorText || "The image host is blocking requests",
            url: imageUrl,
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch image",
          status: response.status,
          details: errorText || response.statusText,
          url: imageUrl,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error fetching exercise image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
