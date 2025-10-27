"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TagList } from "@/components/ui/tag-list";
import { CtaBanner } from "@/components/ui/cta-banner";

const tags = ["Baby & Toddler", "STEM", "Arts & Crafts"];

export default function UiPreviewPage() {
  return (
    <main className="min-h-screen bg-cream py-16 px-8">
      <div className="mx-auto max-w-6xl space-y-16">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-teal mb-2">Parent Helper UI Kit</h1>
          <p className="text-sage">Internal preview of reusable UI components — not for production.</p>
        </header>

        <section className="ui-preview-section">
          <h2 className="text-2xl font-semibold mb-4 text-teal-dark">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="lg">Large Button</Button>
          </div>
        </section>

        <section className="ui-preview-section">
          <h2 className="text-2xl font-semibold mb-4 text-teal-dark">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge label="New" />
            <Badge label="Featured" color="teal" />
            <Badge label="Popular" color="sage" />
          </div>
        </section>

        <section className="ui-preview-section">
          <h2 className="text-2xl font-semibold mb-4 text-teal-dark">TagList</h2>
          <TagList tags={tags} />
        </section>

        <section className="ui-preview-section">
          <h2 className="text-2xl font-semibold mb-4 text-teal-dark">Card</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Winchester Baby Sensory">
              <p>Interactive sensory sessions designed for babies 0–12 months.</p>
              <div className="mt-3">
                <Button size="sm">View details →</Button>
              </div>
            </Card>

            <Card title="Junior Coding Lab">
              <p>STEM coding club for curious minds aged 7–11.</p>
              <div className="mt-3">
                <Button variant="outline" size="sm">
                  Enroll
                </Button>
              </div>
            </Card>
          </div>
        </section>

        <section className="ui-preview-section">
          <h2 className="text-2xl font-semibold mb-4 text-teal-dark">Call-to-Action Banner</h2>
          <CtaBanner />
        </section>
      </div>
    </main>
  );
}
