"use client";

import WeatherCard from "@/components/WeatherCard";

type Props = {
  city: string;
};

export default function WeatherCardLoader({ city }: Props) {
  return <WeatherCard city={city} />;
}

