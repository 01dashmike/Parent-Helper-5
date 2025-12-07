"use client";

import LinkComponent from "@/components/ui/link";
import { Scale, Heart, Building2, FileText, ExternalLink } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

interface SendResource {
  id: string;
  title: string;
  summary?: string | null;
  category: string;
  url: string;
  region?: string | null;
  source: string;
}

interface SendResourceListProps {
  resources: SendResource[];
}

const categoryIcons = {
  legal: Scale,
  support: Heart,
  charity: Heart,
  council: Building2,
  default: FileText,
};

export function SendResourceList({ resources }: SendResourceListProps) {
  const groupedByCategory = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, SendResource[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedByCategory).map(([category, items]) => {
        const Icon = categoryIcons[category as keyof typeof categoryIcons] || categoryIcons.default;
        return (
          <div key={category}>
            <div className="mb-4 flex items-center gap-2">
              <Icon size={iconSize.md} className="text-brand" aria-hidden="true" />
              <h2 className="text-title font-semibold text-text-primary capitalize">{category}</h2>
            </div>
            <div className="space-y-3">
              {items.map((resource) => (
                <LinkComponent
                  key={resource.id}
                  href={resource.url}
                  className="block rounded-lg border border-text-primary/10 bg-surface-alt p-4 transition hover:border-sage/40 hover:shadow-md"
                  aria-label={`View ${resource.title} (opens in new tab)`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold text-text-primary">{resource.title}</h3>
                        <span className="text-small text-text-tertiary">({resource.source})</span>
                      </div>
                      {resource.summary && (
                        <p className="text-small text-text-tertiary">{resource.summary}</p>
                      )}
                      {resource.region && (
                        <span className="mt-2 inline-block text-small text-text-tertiary">
                          Region: {resource.region}
                        </span>
                      )}
                    </div>
                    <ExternalLink size={iconSize.md} className="flex-shrink-0 text-text-primary/30" aria-hidden="true" />
                  </div>
                </LinkComponent>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


