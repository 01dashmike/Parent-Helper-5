import { NextResponse } from 'next/server';

import { classesByTown, getClassesForTown } from '@/app/lib/classes';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const town = searchParams.get('town');

  if (town) {
    const classes = getClassesForTown(town) ?? [];
    return NextResponse.json({ town: town.toLowerCase(), classes });
  }

  return NextResponse.json({ towns: classesByTown });
}
