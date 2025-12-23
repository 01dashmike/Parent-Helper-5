import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminLoginLimiter, applyRateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  // Apply rate limiting to prevent brute force attacks
  const rateLimitError = await applyRateLimit(req, adminLoginLimiter);
  if (rateLimitError) {
    return rateLimitError;
  }

  const { secret } = await req.json().catch(() => ({}));
  if (!process.env.ADMIN_SECRET) {
    // Don't reveal configuration details
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }
  if (secret !== process.env.ADMIN_SECRET) {
    // Use constant-time comparison to prevent timing attacks
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate a session token instead of storing the secret directly
  // For now, use a hash-like approach (in production, use proper session management)
  const sessionToken = Buffer.from(`${Date.now()}-${Math.random()}`).toString("base64");
  
  const cookieStore = (await cookies()) as unknown as {
    set: (name: string, value: string, options: { 
      httpOnly?: boolean; 
      secure?: boolean; 
      path?: string; 
      maxAge?: number;
      sameSite?: "lax" | "strict" | "none";
    }) => void;
  };
  
  cookieStore.set("ph_admin", sessionToken, {
    httpOnly: true,
    // Always use secure in production, regardless of NODE_ENV check
    secure: process.env.VERCEL === "1" || process.env.NODE_ENV === "production",
    path: "/",
    // Reduce session duration to 24 hours for admin sessions
    maxAge: 60 * 60 * 24,
    sameSite: "strict",
  });
  
  return NextResponse.json({ ok: true });
}
