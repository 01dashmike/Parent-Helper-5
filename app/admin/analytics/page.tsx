"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), {
  ssr: false,
});
const LeafletTooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), {
  ssr: false,
});

interface NewsletterRow {
  date: string;
  impressions: number;
  signups: number;
}

interface ClassViewRow {
  date: string;
  views: number;
}

interface Summary {
  impressions: number;
  signups: number;
  conversion: number;
  totalViews: number;
  topClasses?: Array<{ class_id: string | number; views: number; class_name?: string }>;
  campaigns?: Array<{
    utm_campaign: string;
    utm_source: string | null;
    utm_medium: string | null;
    views: number;
    signups: number;
    conversion: number;
  }>;
}

interface GeoPoint {
  town: string | null;
  region: string | null;
  lat: number;
  lng: number;
  signups: number;
  views: number;
}

interface FunnelPoint {
  day: string;
  views: number;
  signups: number;
  bookings: number;
}

interface RetentionPoint {
  parent_email: string;
  first_visit: string;
  total_bookings: number;
  days_between_first_last: number;
}

export default function AnalyticsDashboard() {
  const [newsletterData, setNewsletterData] = useState<NewsletterRow[]>([]);
  const [classViewData, setClassViewData] = useState<ClassViewRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    impressions: 0,
    signups: 0,
    conversion: 0,
    totalViews: 0,
    topClasses: [],
    campaigns: [],
  });
  const [geoData, setGeoData] = useState<GeoPoint[]>([]);
  const [funnelData, setFunnelData] = useState<{
    funnel: FunnelPoint[];
    retention: RetentionPoint[];
  }>({
    funnel: [],
    retention: [],
  });
  const [aiSummary, setAiSummary] = useState("Generating insights …");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/analytics");
        if (!response.ok) throw new Error("Failed to load analytics");
        const json = await response.json();
        setNewsletterData(json.newsletter || []);
        setClassViewData(json.classViews || []);
        setSummary(json.summary || summary);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchGeoAnalytics() {
      try {
        const res = await fetch("/api/geo-analytics");
        if (!res.ok) throw new Error("Failed to load geo analytics");
        const json: {
          data?: Array<{
            town: string | null;
            region: string | null;
            lat: number | string | null;
            lng: number | string | null;
            signups?: number | string | null;
            views?: number | string | null;
          }>;
        } = await res.json();

        const data: GeoPoint[] = (json.data ?? [])
          .map((point) => {
            const lat = typeof point.lat === "number" ? point.lat : Number(point.lat ?? NaN);
            const lng = typeof point.lng === "number" ? point.lng : Number(point.lng ?? NaN);
            return {
              town: point.town ?? null,
              region: point.region ?? null,
              lat,
              lng,
              signups: Number(point.signups ?? 0),
              views: Number(point.views ?? 0),
            } satisfies GeoPoint;
          })
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

        setGeoData(data);
      } catch (error) {
        console.error("Geo analytics fetch error", error);
      }
    }

    fetchGeoAnalytics();
  }, []);

  useEffect(() => {
    async function fetchFunnelAnalytics() {
      try {
        const res = await fetch("/api/funnel");
        if (!res.ok) throw new Error("Failed to load funnel analytics");
        const json: { funnel?: FunnelPoint[]; retention?: RetentionPoint[] } = await res.json();
        setFunnelData({
          funnel: json.funnel ?? [],
          retention: json.retention ?? [],
        });
      } catch (error) {
        console.error("Funnel analytics fetch error", error);
      }
    }

    fetchFunnelAnalytics();
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/ai-insights")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json?.summary) {
          setAiSummary(json.summary as string);
        } else {
          setAiSummary("No AI insight available.");
        }
      })
      .catch(() => {
        if (isMounted) setAiSummary("Unable to load AI insights.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const combinedData = useMemo(() => {
    const byDate = new Map<
      string,
      { date: string; impressions: number; signups: number; views: number }
    >();

    newsletterData.forEach((row) => {
      byDate.set(row.date, {
        date: row.date,
        impressions: row.impressions,
        signups: row.signups,
        views: 0,
      });
    });

    classViewData.forEach((row) => {
      const existing = byDate.get(row.date);
      if (existing) {
        existing.views = row.views;
      } else {
        byDate.set(row.date, {
          date: row.date,
          impressions: 0,
          signups: 0,
          views: row.views,
        });
      }
    });

    return Array.from(byDate.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [newsletterData, classViewData]);

  const handleExportCSV = () => {
    const rows = [
      ["Date", "Impressions", "Signups", "Views"],
      ...combinedData.map((row) => [row.date, row.impressions, row.signups, row.views]),
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "analytics_report.csv");
  };

  const mapCenter = useMemo<[number, number]>(() => {
    if (geoData.length) {
      const first = geoData.find(
        (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)
      );
      if (first) return [first.lat, first.lng];
    }
    return [51.5, -0.12];
  }, [geoData]);

  if (loading) {
    return <div className="p-12 text-center text-brand-teal">Loading analytics…</div>;
  }

  return (
    <div className="min-h-screen bg-brand-cream px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-teal">
              Parent Helper Analytics Dashboard
            </h1>
            <p className="text-sm text-brand-lavender">
              Newsletter performance, class views, and engagement trends, all in one place.
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            className="bg-brand-coral text-white shadow-md hover:bg-brand-teal"
          >
            Export CSV
          </Button>
        </header>

        <section className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-brand-teal uppercase tracking-wide">
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-brand-teal">{summary.impressions}</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-brand-coral uppercase tracking-wide">
                Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-brand-coral">{summary.signups}</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-brand-lavender uppercase tracking-wide">
                Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-brand-lavender">{summary.conversion}%</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-brand-sage uppercase tracking-wide">
                Total Class Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-brand-sage">{summary.totalViews}</p>
            </CardContent>
          </Card>
        </section>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {combinedData.length ? (
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E2F5" />
                  <XAxis dataKey="date" stroke="#007A74" tick={{ fontSize: 12 }} tickMargin={8} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 16, borderColor: "#D7E8E0" }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#E7E2F5"
                    strokeWidth={3}
                    dot={false}
                    name="Impressions"
                  />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#FF7A73"
                    strokeWidth={3}
                    dot={false}
                    name="Signups"
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#D7E8E0"
                    strokeWidth={3}
                    dot={false}
                    name="Class Views"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-brand-lavender">No engagement data available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Top Viewed Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.topClasses && summary.topClasses.length ? (
              <ul className="divide-y divide-brand-sage/60">
                {summary.topClasses.map((cls) => (
                  <li key={cls.class_id} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-semibold text-brand-teal">
                      {cls.class_name ? cls.class_name : `Class #${cls.class_id}`}
                    </span>
                    <span className="font-semibold text-brand-coral">{cls.views} views</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-lavender">No class view data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Top Campaigns (UTM)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.campaigns && summary.campaigns.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-brand-sage/60 text-left text-brand-textMuted">
                    <tr>
                      <th className="py-2 pr-4">Campaign</th>
                      <th className="py-2 pr-4">Source</th>
                      <th className="py-2 pr-4">Medium</th>
                      <th className="py-2 pr-4 text-right">Views</th>
                      <th className="py-2 pr-4 text-right">Signups</th>
                      <th className="py-2 text-right">Conv%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.campaigns.map((campaign) => (
                      <tr
                        key={`${campaign.utm_campaign}-${campaign.utm_source}-${campaign.utm_medium}`}
                        className="border-b border-brand-sage/40 hover:bg-brand-sage/10"
                      >
                        <td className="py-3 pr-4 font-medium text-brand-teal">
                          {campaign.utm_campaign}
                        </td>
                        <td className="py-3 pr-4 text-brand-textMuted">
                          {campaign.utm_source ?? "(none)"}
                        </td>
                        <td className="py-3 pr-4 text-brand-textMuted">
                          {campaign.utm_medium ?? "(none)"}
                        </td>
                        <td className="py-3 pr-4 text-right text-brand-teal">{campaign.views}</td>
                        <td className="py-3 pr-4 text-right text-brand-coral">
                          {campaign.signups}
                        </td>
                        <td className="py-3 text-right text-brand-lavender">
                          {typeof campaign.conversion === "number"
                            ? campaign.conversion.toFixed(1)
                            : Number(campaign.conversion || 0).toFixed(1)}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-brand-lavender">No campaign data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Geo Heatmap of Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full overflow-hidden rounded-lg">
              {geoData.length && MapContainer ? (
                <MapContainer
                  center={mapCenter}
                  zoom={6}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {geoData.map((point) => {
                    const radius = Math.max(
                      4,
                      Math.sqrt((point.signups || 0) + (point.views || 0)) * 2
                    );
                    return (
                      <CircleMarker
                        key={`${point.town}-${point.region}-${point.lat}-${point.lng}`}
                        center={[point.lat, point.lng]}
                        radius={radius}
                        pathOptions={{ color: "#FF7A73", fillColor: "#007A74", fillOpacity: 0.4 }}
                      >
                        <LeafletTooltip direction="top" offset={[0, -5]}>
                          <div className="text-xs">
                            <strong>
                              {point.town || "Unknown"}, {point.region || "Unknown"}
                            </strong>
                            <br />
                            {point.signups} signups | {point.views} views
                          </div>
                        </LeafletTooltip>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-brand-lavender">
                  No geographic data yet.
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-end text-xs text-brand-textMuted">
              <span className="mr-2">Fewer signups</span>
              <div className="mx-2 h-2 w-28 rounded-full bg-gradient-to-r from-brand-sage via-brand-coral to-brand-teal" />
              <span>More signups</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const latest = funnelData.funnel[0];
              if (!latest || latest.views === 0 || latest.signups === 0) {
                return <p className="text-sm text-brand-lavender">No conversion data yet.</p>;
              }
              const signupRate = latest.views
                ? ((latest.signups / latest.views) * 100).toFixed(1)
                : "0.0";
              const bookingRate = latest.signups
                ? ((latest.bookings / latest.signups) * 100).toFixed(1)
                : "0.0";
              return (
                <ul className="space-y-2 text-sm">
                  <li>
                    View → Signup:{" "}
                    <span className="font-semibold text-brand-coral">{signupRate}%</span>
                  </li>
                  <li>
                    Signup → Booking:{" "}
                    <span className="font-semibold text-brand-teal">{bookingRate}%</span>
                  </li>
                </ul>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Daily Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.funnel.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...funnelData.funnel].reverse()}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="views" stackId="a" fill="#D7E8E0" name="Views" />
                  <Bar dataKey="signups" stackId="a" fill="#FF7A73" name="Signups" />
                  <Bar dataKey="bookings" stackId="a" fill="#007A74" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-brand-lavender">No funnel data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Retention &amp; Repeat Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.retention.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={funnelData.retention}>
                  <XAxis dataKey="days_between_first_last" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="total_bookings" stroke="#FF7A73" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-brand-lavender">No retention data yet.</p>
            )}
            <p className="mt-3 text-xs text-brand-textMuted">
              Shows how many parents return to book again after their first class.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-brand-cream via-white to-brand-sage/40 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <span aria-hidden="true" className="text-lg">
              ✨
            </span>
            <CardTitle className="text-brand-teal">AI Insights &amp; Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-6 text-brand-textMuted">
              {aiSummary}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
