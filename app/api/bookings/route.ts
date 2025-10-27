import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabaseServer";
import { sendBookingEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabase = getSupabaseServer();

    const { error } = await supabase.from("booking_requests").insert([payload]);
    if (error) throw error;

    await sendBookingEmail(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking API error", error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
