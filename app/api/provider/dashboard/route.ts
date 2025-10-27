import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

interface BookingRow {
  id: number;
  providerId: number;
  session_date: string | null;
  created_at: string | null;
  total_paid: number | string | null;
}

interface ClassRow {
  id: number;
  name: string;
  views: number | null;
  rating: number | null;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providerId = user.id;

    const [{ data: bookings, error: bookingsError }, { data: classes, error: classesError }] =
      await Promise.all([
        supabase.from("bookings").select("*").eq("providerId", providerId),
        supabase.from("classes").select("id,name,views,rating").eq("providerId", providerId),
      ]);

    if (bookingsError) throw bookingsError;
    if (classesError) throw classesError;

    const bookingRows = (bookings ?? []) as BookingRow[];
    const classRows = (classes ?? []) as ClassRow[];

    const totalBookings = bookingRows.length;
    const totalRevenue = bookingRows.reduce(
      (acc, booking) => acc + Number(booking.total_paid ?? 0),
      0
    );
    const avgRating =
      classRows.length > 0
        ? classRows.reduce((acc, current) => acc + Number(current.rating ?? 0), 0) /
          classRows.length
        : 0;

    const trendsMap = new Map<string, number>();
    bookingRows.forEach((booking) => {
      const date = booking.session_date ?? booking.created_at ?? undefined;
      if (!date) return;
      const day = date.split("T")[0];
      const current = trendsMap.get(day) ?? 0;
      trendsMap.set(day, current + 1);
    });

    const trends = Array.from(trendsMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, bookingsCount]) => ({ date, bookings: bookingsCount }));

    const popularity = classRows
      .map((classRow) => ({
        class: classRow.name,
        views: Number(classRow.views ?? 0),
      }))
      .sort((a, b) => b.views - a.views);

    const revenueByCategory = [
      {
        category: "Classes",
        value: totalRevenue,
      },
    ];

    let aiTips = "Keep up the great work!";
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const openai = new OpenAI({ apiKey });
        const aiPrompt = `
You are a business coach for a provider on Parent Helper.
Given their data, write a short (under 150 words) summary of how they’re performing and 2 actionable tips to increase bookings or engagement.
Data:
- Bookings: ${totalBookings}
- Revenue: £${totalRevenue.toFixed(2)}
- Average rating: ${avgRating.toFixed(2)}
- Top classes: ${JSON.stringify(popularity.slice(0, 5))}
- Booking trend: ${JSON.stringify(trends.slice(-10))}
`;

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are concise, positive, and practical." },
            { role: "user", content: aiPrompt },
          ],
          temperature: 0.6,
          max_tokens: 350,
        });

        aiTips = aiResponse.choices[0]?.message?.content?.trim() ?? aiTips;
      } catch (aiError) {
        console.error("[provider-dashboard] AI generation failed", aiError);
        aiTips =
          "Keep up the great work! Focus on building relationships with families already attending.";
      }
    }

    return NextResponse.json({
      stats: {
        totalBookings,
        totalRevenue,
        avgRating,
      },
      trends,
      popularity,
      revenueByCategory,
      aiTips,
    });
  } catch (error) {
    console.error("Provider dashboard error", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
