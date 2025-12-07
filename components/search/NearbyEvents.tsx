"use client";

import { useState, useCallback, useEffect, useMemo, memo, lazy, Suspense } from "react";
import type { MapPoint } from "./ResultsSplitMap";
import { isNearbyEventsEnabled } from "@/lib/env";
import { safeFetch } from "@/lib/client/safeFetch";
import { NearbyEventsSkeleton } from "./NearbyEventsSkeleton";
import { formatDateWithTime } from "@/lib/utils/date";
import { List, ListItem } from "@/components/lists";
import LinkComponent from "@/components/ui/link";
import { ErrorState } from "@/components/ui/errorstate";
import { EmptyState } from "@/components/ui/emptystate";
import { Button } from "@/components/ui/button";

// Lazy load heavy map component for code splitting
const MapPane = lazy(() => import("./ResultsSplitMap").then(m => ({ default: m.MapPane })));

type Event = {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  url: string;
  venue: {
    name: string;
    address: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  onlineEvent: boolean;
};

type NearbyEventsProps = {
  latitude: number | null;
  longitude: number | null;
  radiusKm?: number;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return formatDateWithTime(dateString);
  } catch {
    return dateString;
  }
}

const NearbyEvents = memo(function NearbyEvents({
  latitude,
  longitude,
  radiusKm = 10,
}: NearbyEventsProps): React.ReactNode {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadEvents = useCallback(async (): Promise<void> => {
    if (latitude == null || longitude == null) {
      setError("Location not available");
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      radiusKm: radiusKm.toString(),
    });

    const result = await safeFetch<{ events: Event[] }>(`/api/events/nearby?${params.toString()}`);

    if (!result.ok) {
      setError(result.error || "Failed to load events");
      setLoading(false);
      return;
    }

    const events = Array.isArray(result.data?.events) ? result.data.events : [];
    setEvents(events.filter((e): e is Event => e != null && e.id != null && e.title != null));
    setHasLoaded(true);
    setLoading(false);
  }, [latitude, longitude, radiusKm]);

  // Refresh events automatically when location or radius changes after initial load
  // This keeps the widget in sync with the current search/map state without changing the initial UX.
  useEffect(() => {
    if (!hasLoaded) return;
    void loadEvents();
  }, [hasLoaded, loadEvents]);

  const mapPoints = useMemo<MapPoint[]>(() => {
    if (!events || !Array.isArray(events) || events.length === 0) return [];
    
    return events
      .filter(
        (event) => {
          if (!event || !event.id || !event.title) return false;
          const lat = event.venue?.latitude;
          const lng = event.venue?.longitude;
          return (
            lat != null &&
            lng != null &&
            typeof lat === "number" &&
            typeof lng === "number" &&
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
          );
        }
      )
      .map((event) => ({
        id: event.id,
        lat: event.venue!.latitude!,
        lng: event.venue!.longitude!,
        name: event.title,
        venue: event.venue?.name || undefined,
      }));
  }, [events]);

  const mapCenter = useMemo<[number, number] | null>(() => {
    if (!mapPoints || mapPoints.length === 0) {
      // Fallback to provided coordinates if available
      if (
        latitude != null &&
        longitude != null &&
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        !isNaN(latitude) &&
        !isNaN(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        return [latitude, longitude];
      }
      return null;
    }
    const firstPoint = mapPoints[0];
    if (!firstPoint) {
      // Fallback to provided coordinates if available
      if (
        latitude != null &&
        longitude != null &&
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        !isNaN(latitude) &&
        !isNaN(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        return [latitude, longitude];
      }
      return null;
    }
    // Validate coordinates before using
    if (
      typeof firstPoint.lat === "number" &&
      typeof firstPoint.lng === "number" &&
      !isNaN(firstPoint.lat) &&
      !isNaN(firstPoint.lng) &&
      firstPoint.lat >= -90 &&
      firstPoint.lat <= 90 &&
      firstPoint.lng >= -180 &&
      firstPoint.lng <= 180
    ) {
      return [firstPoint.lat, firstPoint.lng];
    }
    // Fallback to provided coordinates if available
    if (
      latitude != null &&
      longitude != null &&
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return [latitude, longitude];
    }
    return null;
  }, [mapPoints, latitude, longitude]);

  // Early return if feature is disabled - robust check prevents crashes
  if (!isNearbyEventsEnabled()) {
    return null;
  }

  // Check for null/undefined explicitly (0 is a valid coordinate)
  if (latitude == null || longitude == null) {
    return null;
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title font-semibold text-charcoal">
            Nearby Family Events
          </h2>
          <p className="mt-1 text-small text-text-tertiary">
            Discover family-friendly events from Eventbrite in your area
          </p>
        </div>
        {!hasLoaded && (
          <Button
            type="button"
            onClick={loadEvents}
            disabled={loading}
            size="default"
            variant="default"
            className="shadow-soft"
            aria-label="Load nearby family events"
            aria-busy={loading ? "true" : "false"}
          >
            {loading ? "Loading..." : "Load events"}
          </Button>
        )}
      </div>

      {loading && <NearbyEventsSkeleton />}

      {error && (
        <ErrorState
          title="Unable to load events"
          message={error}
          onRetry={loadEvents}
          retryLabel="Try again"
          isDynamic={true}
        />
      )}

      {hasLoaded && events.length === 0 && !loading && (
        <EmptyState
          title="No events found"
          description="Try widening your search radius or check back later for new events."
          iconVariant="search"
        />
      )}

      {hasLoaded && events.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div aria-live="polite" aria-atomic="true">
              <p className="text-small text-text-tertiary">
                Found {events.length} event{events.length !== 1 ? "s" : ""}
              </p>
            </div>
            {mapPoints.length > 0 && (
              <Button
                type="button"
                onClick={() => setShowMap(!showMap)}
                size="default"
                variant="ghost"
                className="text-sage"
                aria-label={showMap ? "Hide map" : "Show map"}
              >
                {showMap ? "Hide map" : "Show map"}
              </Button>
            )}
          </div>

          {showMap && mapCenter && mapPoints.length > 0 && (
            <div className="h-[50vh] w-full overflow-hidden rounded-2xl border border-sage/20">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <p className="text-small text-charcoal/50">Loading map...</p>
                </div>
              }>
                <MapPane points={mapPoints} center={mapCenter} zoom={11} />
              </Suspense>
            </div>
          )}

          <List 
            aria-label="Nearby family events" 
            aria-busy="false"
            className="space-y-3"
          >
            {events.map((event) => (
              <ListItem
                key={event.id}
                className="card rounded-2xl overflow-hidden shadow-card bg-white border-l-0 transition-standard hover:border-sage/40"
              >
                <article className="w-full">
                <div className="p-section">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-body font-semibold text-charcoal truncate" lang="en">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="mt-1 line-clamp-2 text-small text-text-tertiary" lang="en">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-small text-text-tertiary">
                        {event.startDate && (
                          <span className="flex items-center gap-1">
                            <span aria-hidden>📅</span>
                            <time dateTime={event.startDate}>
                              {formatDate(event.startDate)}
                            </time>
                          </span>
                        )}
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <span aria-hidden>📍</span>
                            <span className="truncate" lang="en">
                              {event.venue?.name}
                              {event.venue?.city && `, ${event.venue.city}`}
                            </span>
                          </span>
                        )}
                        {event.onlineEvent && (
                          <span className="rounded-full bg-sage/15 px-2 py-1 text-sage">
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                    <LinkComponent
                      href={event.url}
                      className="shrink-0 inline-flex items-center justify-center rounded-card px-md py-sm text-small font-medium bg-accent text-white hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 transition-all duration-200"
                      aria-label={`View ${event.title} on Eventbrite`}
                    >
                      View on Eventbrite
                    </LinkComponent>
                  </div>
                </div>
                </article>
              </ListItem>
            ))}
          </List>

          <div className="rounded-lg border border-sage/20 bg-cream/50 p-3 text-center">
            <p className="text-small text-text-tertiary">
              Events powered by{" "}
              <LinkComponent
                href="https://www.eventbrite.co.uk"
                aria-label="Eventbrite (opens in new tab)"
                className="font-medium text-brand hover:underline"
              >
                Eventbrite
              </LinkComponent>
            </p>
          </div>
        </>
      )}
    </section>
  );
});

NearbyEvents.displayName = "NearbyEvents";

export default NearbyEvents;

