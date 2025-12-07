"use client";

import CityEvents from "@/components/city/CityEvents";

type Props = {
  cityName: string;
};

export default function CityEventsLoader(props: Props) {
  return <CityEvents {...props} />;
}

