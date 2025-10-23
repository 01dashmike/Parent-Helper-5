import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { question } = await request.json();

  const cannedReplies = [
    "Here's what I found for baby classes near you:",
    "Try searching under 'Parent & Baby' or 'Music & Movement'.",
    "• [Baby Yoga Winchester](https://example.com)\n• [Toddler Playtime Basingstoke](https://example.com)\n[View all results](https://example.com/all)",
  ];

  const answer = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
  return NextResponse.json({ answer, question });
}
