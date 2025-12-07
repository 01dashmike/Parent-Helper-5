import { Metadata } from "next";
import { MarketingBoosterClient } from "./MarketingBoosterClient";

export const metadata: Metadata = {
  title: "Marketing Booster | Provider Console",
  description: "SEO insights and advertising advice for your classes",
};

export default function MarketingBoosterPage() {
  return <MarketingBoosterClient />;
}

