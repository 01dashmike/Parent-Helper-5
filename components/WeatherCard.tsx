"use client";

import { useState, useEffect } from "react";
import { isWeatherWidgetEnabled } from "@/lib/env";

// Type extension for requestIdleCallback (not in all browsers)
type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type WeatherCardProps = {
  city: string;
};

type WeatherData = {
  temp: number;
  condition: string;
  city: string;
};

export default function WeatherCard({ city }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isWeatherWidgetEnabled() || !city) {
      return;
    }

    // Load weather after LCP using requestIdleCallback (non-blocking)
    const loadWeather = () => {
      setLoading(true);
      fetchWeather(city)
        .then((data) => {
          if (data) {
            setWeather(data);
          }
        })
        .catch((_error) => {
          console.error("[WeatherCard] Unexpected error:", _error);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    if (typeof window !== "undefined") {
      // Wait for LCP, then use requestIdleCallback
      const windowWithIdle = window as WindowWithIdleCallback;
      if (windowWithIdle.requestIdleCallback) {
        // Wait a bit for LCP, then use idle callback
        const timeout = setTimeout(() => {
          const idleCallback = windowWithIdle.requestIdleCallback!(loadWeather, { timeout: 3000 });
          return () => {
            if (windowWithIdle.cancelIdleCallback) {
              windowWithIdle.cancelIdleCallback(idleCallback);
            }
          };
        }, 2000);

        return () => {
          clearTimeout(timeout);
        };
      } else {
        // Fallback: delay by 2 seconds (after LCP)
        const timeout = setTimeout(loadWeather, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [city]);

  if (!isWeatherWidgetEnabled() || (!weather && !loading)) {
    return null;
  }

  return (
    <div className="inline-flex min-h-[32px] items-center gap-2 rounded-full border border-sage/20 bg-white/80 px-3 py-1.5 text-small text-text-tertiary backdrop-blur-sm">
      {loading ? (
        <>
          <div className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none rounded-full border-2 border-sage/30 border-t-sage" />
          <span className="whitespace-nowrap">Loading weather...</span>
        </>
      ) : weather ? (
        <span className="whitespace-nowrap">
          {weather.condition} · {weather.temp} °C in {weather.city}
        </span>
      ) : null}
    </div>
  );
}

async function fetchWeather(city: string): Promise<WeatherData | null> {
  try {
    // Use Open-Meteo geocoding API (no API key needed)
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      return null;
    }

    const geoData = await geoResponse.json();
    if (!geoData?.results || geoData.results.length === 0) {
      return null;
    }

    const { latitude, longitude, name } = geoData.results[0] || {};

    // Fetch current weather from Open-Meteo (no API key needed)
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
    );

    if (!weatherResponse.ok) {
      return null;
    }

    const weatherData = await weatherResponse.json();
    const temp = Math.round(weatherData.current.temperature_2m);
    const weatherCode = weatherData.current.weather_code;

    // Map WMO weather codes to readable conditions
    const condition = getWeatherCondition(weatherCode);

    return {
      temp,
      condition,
      city: name,
    };
  } catch (error) {
    console.error("[WeatherCard] Weather fetch error:", error);
    return null;
  }
}

function getWeatherCondition(code: number): string {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Clear";
}

