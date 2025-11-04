import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { secret } = await req.json().catch(() => ({}));
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "ADMIN_SECRET not set" }, { status: 500 });
  }
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  const cookieStore = (await cookies()) as unknown as {
    set: (name: string, value: string, options: { httpOnly?: boolean; secure?: boolean; path?: string; maxAge?: number }) => void;
  };
  cookieStore.set("ph_admin", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ok: true });
}
