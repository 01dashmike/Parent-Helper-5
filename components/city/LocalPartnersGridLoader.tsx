"use client";

import LocalPartnersGrid from "@/components/city/LocalPartnersGrid";

type Props = {
  citySlug: string;
};

export default function LocalPartnersGridLoader(props: Props) {
  return <LocalPartnersGrid {...props} />;
}

