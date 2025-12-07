"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface ActivityFilterBarProps {
  filters: {
    dateRange: "24h" | "7d" | "30d" | "all";
    scope: string;
    level: "" | "info" | "warning" | "error";
  };
  onFilterChange: (filters: ActivityFilterBarProps["filters"]) => void;
}

export function ActivityFilterBar({ filters, onFilterChange }: ActivityFilterBarProps) {
  return (
    <div className="rounded-lg border border-sage/20 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="date-range" className="mb-2 block text-small font-medium">
            Date Range
          </Label>
          <Select
            value={filters.dateRange}
            onValueChange={(value: "24h" | "7d" | "30d" | "all") =>
              onFilterChange({ ...filters, dateRange: value })
            }
          >
            <SelectTrigger id="date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="scope" className="mb-2 block text-small font-medium">
            Scope
          </Label>
          <Select
            value={filters.scope || "all"}
            onValueChange={(value) =>
              onFilterChange({ ...filters, scope: value === "all" ? "" : value })
            }
          >
            <SelectTrigger id="scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All scopes</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
              <SelectItem value="class">Class</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="level" className="mb-2 block text-small font-medium">
            Level
          </Label>
          <Select
            value={filters.level || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                level: value === "all" ? "" : (value as "info" | "warning" | "error"),
              })
            }
          >
            <SelectTrigger id="level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

