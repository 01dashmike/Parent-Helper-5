"use client";

import { LocalPhotoChip } from "@/app/[town]/LocalPhotoChip";

type Props = {
  cityName: string;
  lat: number | null;
  lon: number | null;
};

export default function LocalPhotoChipLoader({
  cityName,
  lat,
  lon,
}: Props) {
  return <LocalPhotoChip cityName={cityName} lat={lat} lon={lon} />;
}

