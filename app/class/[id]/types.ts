export type ClassPageData = {
  id: string;
  name?: string;
  title?: string;
  summary?: string | null;
  description: string | null;
  price: string | null;
  booking_url: string | null;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  created_at: string;
  provider_id?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
  main_category?: string | null;
  providers: {
    id: number;
    name: string;
    slug: string | null;
    website: string | null;
    contact_email: string | null;
    reputation?: {
      avg_rating: number | null;
      review_count: number;
    } | null;
  } | null;
  venues: {
    id: string;
    name: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
  } | null;
  class_occurrences?: {
    id: string;
    starts_at: string;
    ends_at: string | null;
    status: string;
    venue_id: string | null;
  }[];
  class_sessions?: Array<{
    id: number;
    title: string | null;
    weekday: number | null;
    start_time: string | null;
    end_time: string | null;
    session_instances: Array<{
      id: number;
      starts_at: string;
      ends_at: string | null;
      status: string;
      bookable: boolean;
      stripe_payment_link_url: string | null;
      capacity: number | null;
      available_spots: number | null;
    }>;
  }>;
  images: Array<{
    storage_path: string;
    alt_text: string | null;
  }>;
};


