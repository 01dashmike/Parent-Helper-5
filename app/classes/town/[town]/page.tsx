import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ClassList from "@/components/classes/ClassList";
import { searchClasses } from "@/lib/db/supabase";
import type { Class } from "@/types";
import type { Metadata } from "next";

export const revalidate = 3600;

interface TownPageProps {
  params: { town: string };
}

export async function generateMetadata({ params }: TownPageProps): Promise<Metadata> {
  const town = decodeURIComponent(params.town);
  const capitalisedTown =
    town.length > 0
      ? town
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : town;

  return {
    title: `Baby & Toddler Classes in ${capitalisedTown} | Parent Helper`,
    description: `Discover baby, toddler, and preschool activities in ${capitalisedTown}.`,
    alternates: {
      canonical: `https://parent-helper-app-parenthelper5.up.railway.app/classes/town/${params.town}`,
    },
  };
}

export default async function TownPage({ params }: TownPageProps) {
  const townName = decodeURIComponent(params.town);
  const classes = await searchClasses({ town: townName });

  const displayName =
    townName.length > 0
      ? townName
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : townName;

  const description = `Discover amazing baby, toddler, and preschool classes in ${displayName}. Search music, sensory, yoga, and swimming activities near you.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Classes in ${displayName}`,
    description,
    numberOfItems: classes.length,
    itemListElement: classes.map((c: Class, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://parent-helper-app-parenthelper5.up.railway.app/classes/${c.id}`,
      name: c.name,
    })),
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="mb-6 text-center text-3xl font-bold text-teal-dark">
          Classes in {displayName}
        </h1>
        {classes.length > 0 ? (
          <ClassList classes={classes as Class[]} />
        ) : (
          <p className="text-center text-lg text-sage">
            No classes found in {displayName}.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const popularTowns = ["london", "manchester", "bristol", "leeds"];
  return popularTowns.map((town) => ({ town }));
}
