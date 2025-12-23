import { NextRequest, NextResponse } from "next/server";
import { getExerciseMedia, getExerciseMediaBatch } from "@/lib/wellness/exercise-media";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const exerciseName = searchParams.get("name");
  const exerciseNames = searchParams.get("names"); // Comma-separated for batch

  if (!exerciseName && !exerciseNames) {
    return NextResponse.json(
      { error: "Missing exercise name parameter" },
      { status: 400 }
    );
  }

  try {
    if (exerciseNames) {
      // Batch request
      const names = exerciseNames.split(",").map((n) => n.trim()).filter(Boolean);
      const mediaMap = await getExerciseMediaBatch(names);
      const result = Object.fromEntries(mediaMap);
      return NextResponse.json({ media: result });
    } else {
      // Single request
      const media = await getExerciseMedia(exerciseName!);
      return NextResponse.json({ media });
    }
  } catch (error) {
    console.error("Error fetching exercise media:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise media" },
      { status: 500 }
    );
  }
}
