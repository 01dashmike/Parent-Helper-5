import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ClassList from "@/components/classes/ClassList";
import { searchClasses } from "@/lib/db/supabase";
import type { Class } from "@/types";

export const revalidate = 3600;

interface TownPageProps {
  params: { town: string };
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

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
