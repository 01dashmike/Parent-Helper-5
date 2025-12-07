"use client";

import LinkComponent from "@/components/ui/link";
import { MapPin, Users, Volume2 } from "lucide-react";
import { Accessibility as Wheelchair } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { SendBadge } from "./SendBadge";

interface SendAccessibleClassCardProps {
  classData: {
    id: number;
    name: string;
    description: string;
    town: string;
    venue: string;
    max_group_size?: number | null;
    noise_level?: string | null;
    wheelchair_access?: boolean;
    send_notes?: string | null;
  };
}

export function SendAccessibleClassCard({ classData }: SendAccessibleClassCardProps) {
  return (
    <LinkComponent
      href={`/class/${classData.id}`}
      className="group rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60 transition-shadow duration-200 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
      prefetch={false}
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-title text-text-primary group-hover:text-brand">
          {classData.name}
        </h3>
        <SendBadge size="sm" />
      </div>

      <p className="mb-4 line-clamp-2 text-small text-text-tertiary">{classData.description}</p>

      <div className="space-y-2 text-small text-text-tertiary">
        <div className="flex items-center gap-2">
          <MapPin size={iconSize.sm} aria-hidden="true" />
          <span>
            {classData.venue}, {classData.town}
          </span>
        </div>

        {classData.max_group_size && (
          <div className="flex items-center gap-2">
            <Users size={iconSize.sm} aria-hidden="true" />
            <span>Max {classData.max_group_size} children</span>
          </div>
        )}

        {classData.noise_level && (
          <div className="flex items-center gap-2">
            <Volume2 size={iconSize.sm} aria-hidden="true" />
            <span className="capitalize">{classData.noise_level} environment</span>
          </div>
        )}

        {classData.wheelchair_access && (
          <div className="flex items-center gap-2">
            <Wheelchair size={iconSize.sm} aria-hidden="true" />
            <span>Wheelchair accessible</span>
          </div>
        )}
      </div>

      {classData.send_notes && (
        <div className="mt-4 rounded-lg bg-brand/5 p-3 text-small text-text-tertiary">
          {classData.send_notes}
        </div>
      )}
    </LinkComponent>
  );
}


