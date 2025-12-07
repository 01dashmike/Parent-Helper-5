"use client";

import { useState, useMemo, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { ProviderBooking } from "@/lib/bookings/provider";

type ProviderBookingsClientProps = {
  initialBookings: ProviderBooking[];
  initialStats: {
    total: number;
    confirmed: number;
    cancelled: number;
    attended: number;
    revenue: number;
  };
  providerId: number;
};

export default function ProviderBookingsClient({
  initialBookings,
  initialStats,
  providerId,
}: ProviderBookingsClientProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));

  // Filter bookings with memoization for better performance
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName =
          booking.parentFirstName.toLowerCase().includes(query) ||
          booking.parentLastName.toLowerCase().includes(query) ||
          booking.parentEmail.toLowerCase().includes(query);
        const matchesChild = booking.children.some((c) => c.name.toLowerCase().includes(query));
        const matchesClass = booking.class?.name.toLowerCase().includes(query);
        if (!matchesName && !matchesChild && !matchesClass) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  const handleExport = useCallback(() => {
    // Simple CSV export
    const headers = ["Date", "Time", "Class", "Parent", "Children", "Type", "Status", "Amount"];
    const rows = filteredBookings.map((b) => {
      const sessionDate = b.session ? new Date(b.session.startTime) : null;
      return [
        sessionDate ? format(sessionDate, "yyyy-MM-dd") : "",
        sessionDate ? format(sessionDate, "HH:mm") : "",
        b.class?.name || "",
        `${b.parentFirstName} ${b.parentLastName}`,
        b.children.map((c) => `${c.name} (${c.age})`).join(", "),
        b.bookingType,
        b.status,
        `£${b.priceTotal.toFixed(2)}`,
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  }, [filteredBookings]);

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      pending: "secondary",
      cancelled: "destructive",
      attended: "default",
      refunded: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bookings</h1>
        <p className="text-slateSoft">Manage your class bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slateSoft mb-1">Total Bookings</p>
            <p className="text-2xl font-bold">{initialStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slateSoft mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{initialStats.confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slateSoft mb-1">Attended</p>
            <p className="text-2xl font-bold text-blue-600">{initialStats.attended}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slateSoft mb-1">Revenue</p>
            <p className="text-2xl font-bold text-sage">£{initialStats.revenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slateSoft" />
              <Input
                placeholder="Search by name, email, class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">From</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">To</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-slateSoft">
              <p>No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sage/20">
                    <th className="text-left p-3 text-sm font-semibold">Date & Time</th>
                    <th className="text-left p-3 text-sm font-semibold">Class</th>
                    <th className="text-left p-3 text-sm font-semibold">Parent</th>
                    <th className="text-left p-3 text-sm font-semibold">Children</th>
                    <th className="text-left p-3 text-sm font-semibold">Type</th>
                    <th className="text-left p-3 text-sm font-semibold">Status</th>
                    <th className="text-left p-3 text-sm font-semibold">Amount</th>
                    <th className="text-left p-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const sessionDate = booking.session ? new Date(booking.session.startTime) : null;
                    return (
                      <tr key={booking.id} className="border-b border-sage/10 hover:bg-cream/30">
                        <td className="p-3 text-sm">
                          {sessionDate ? (
                            <>
                              <div>{format(sessionDate, "MMM d, yyyy")}</div>
                              <div className="text-slateSoft">{format(sessionDate, "h:mm a")}</div>
                            </>
                          ) : (
                            <span className="text-slateSoft">N/A</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {booking.class?.name || "N/A"}
                        </td>
                        <td className="p-3 text-sm">
                          <div>{booking.parentFirstName} {booking.parentLastName}</div>
                          <div className="text-slateSoft text-xs">{booking.parentEmail}</div>
                        </td>
                        <td className="p-3 text-sm">
                          {booking.children.map((c, i) => (
                            <div key={i}>
                              {c.name} (age {c.age})
                            </div>
                          ))}
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline">
                            {booking.bookingType === "block" ? "Block" : booking.bookingType === "free_rsvp" ? "RSVP" : "Drop-in"}
                          </Badge>
                        </td>
                        <td className="p-3">{getStatusBadge(booking.status)}</td>
                        <td className="p-3 text-sm font-semibold">£{booking.priceTotal.toFixed(2)}</td>
                        <td className="p-3">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/provider/bookings/${booking.id}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

