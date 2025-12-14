export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserUrl, getSupabaseBrowserKey } from "@/lib/env";
import { cookies } from "next/headers";
import { uploadAboutPageImage } from "@/lib/supabase/storage";

function createAuthenticatedClient() {
  const url = getSupabaseBrowserUrl();
  const key = getSupabaseBrowserKey();
  
  if (!url || !key) {
    throw new Error("Supabase environment variables not configured");
  }

  return createServerClient(url, key, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      async setAll(cookiesToSet) {
        const cookieStore = await cookies();
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, {
            path: options?.path || "/",
            sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
          });
        });
      },
    },
  });
}

async function validateAdmin() {
  const supabase = createAuthenticatedClient();
  
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  if (user) {
    return { user, supabase };
  }
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (session?.user) {
    return { user: session.user, supabase };
  }
  
  console.error("Auth validation failed:", {
    getUserError: getUserError?.message,
    sessionError: sessionError?.message,
  });
  
  throw new Error("Unauthorised");
}

/**
 * POST /api/admin/about/upload-image
 * Upload an image for the about page
 */
export async function POST(req: Request) {
  // Validate user is authenticated
  try {
    await validateAdmin();
  } catch (error) {
    console.error("Admin route auth error:", error);
    return NextResponse.json({ 
      error: "Forbidden", 
      message: error instanceof Error ? error.message : "Authentication required" 
    }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const imageType = formData.get("imageType") as "story" | "general" | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!imageType || (imageType !== "story" && imageType !== "general")) {
      return NextResponse.json(
        { error: "imageType must be 'story' or 'general'" },
        { status: 400 }
      );
    }

    // Upload the image
    const result = await uploadAboutPageImage(file, imageType);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: result.url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 }
    );
  }
}
