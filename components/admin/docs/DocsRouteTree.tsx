"use client";

import { useState } from "react";

interface RouteInfo {
  path: string;
  type: "page" | "layout" | "loading" | "error" | "route" | "component";
  isClient: boolean;
  isServer: boolean;
}

interface DocsRouteTreeProps {
  routes: RouteInfo[];
}

export default function DocsRouteTree({ routes }: DocsRouteTreeProps) {
  const [filter, setFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch = route.path.toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === "all" || route.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeColors = {
    page: "bg-blue-100 text-blue-800",
    layout: "bg-purple-100 text-purple-800",
    loading: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    route: "bg-green-100 text-green-800",
    component: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search routes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-small"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-small"
        >
          <option value="all">All Types</option>
          <option value="page">Pages</option>
          <option value="layout">Layouts</option>
          <option value="route">API Routes</option>
          <option value="component">Components</option>
        </select>
      </div>

      <div className="max-h-[600px] overflow-y-auto rounded border border-gray-200 bg-gray-50 p-4">
        <div className="space-y-2">
          {filteredRoutes.length === 0 ? (
            <div className="text-center text-slateSoft">No routes found</div>
          ) : (
            filteredRoutes.map((route) => (
              <div
                key={route.path}
                className="flex items-center justify-between rounded border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-1 text-small font-medium ${typeColors[route.type]}`}>
                    {route.type}
                  </span>
                  <code className="text-small text-charcoal">{route.path || "/"}</code>
                </div>
                <div className="flex items-center gap-2">
                  {route.isClient && (
                    <span className="rounded bg-blue-50 px-2 py-1 text-small text-blue-700">
                      Client
                    </span>
                  )}
                  {route.isServer && (
                    <span className="rounded bg-green-50 px-2 py-1 text-small text-green-700">
                      Server
                    </span>
                  )}
                  <a
                    href={route.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-small text-blue-600 hover:underline"
                    aria-label={`View ${route.path} (opens in new tab)`}
                  >
                    View →
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

