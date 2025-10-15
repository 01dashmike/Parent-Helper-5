import { NextResponse } from 'next/server';

export async function POST(request) {
  const payload = await request.json();

  return NextResponse.json({
    status: 'received',
    receivedAt: new Date().toISOString(),
    payload,
  });
}
