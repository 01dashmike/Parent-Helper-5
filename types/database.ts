export type Database = {
  public: {
    Tables: {
      providers: {
        Row: {
          id: string;
          email: string;
          business_name: string | null;
          contact_name: string | null;
        };
        Insert: {
          id: string;
          email: string;
          business_name?: string | null;
          contact_name?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          business_name?: string | null;
          contact_name?: string | null;
        };
      };
      bookings: {
        Row: {
          id: number;
          providerId: string;
          session_date: string | null;
          created_at: string | null;
          total_paid: number | null;
        };
        Insert: {
          id?: number;
          providerId: string;
          session_date?: string | null;
          created_at?: string | null;
          total_paid?: number | null;
        };
        Update: {
          id?: number;
          providerId?: string;
          session_date?: string | null;
          created_at?: string | null;
          total_paid?: number | null;
        };
      };
      classes: {
        Row: {
          id: number;
          providerId: string;
          name: string;
          description: string | null;
          price: string | null;
          day_of_week: string | null;
          time: string | null;
          category: string | null;
          views: number | null;
          rating: number | null;
          image_urls: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          providerId: string;
          name: string;
          description?: string | null;
          price?: string | null;
          day_of_week?: string | null;
          time?: string | null;
          category?: string | null;
          views?: number | null;
          rating?: number | null;
          image_urls?: string[] | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          providerId?: string;
          name?: string;
          description?: string | null;
          price?: string | null;
          day_of_week?: string | null;
          time?: string | null;
          category?: string | null;
          views?: number | null;
          rating?: number | null;
          image_urls?: string[] | null;
          created_at?: string | null;
        };
      };
      class_views: {
        Row: {
          id: number;
          class_id: number;
          providerId?: string | null;
          session_id: string | null;
          referrer: string | null;
          user_agent: string | null;
          user_id: string | null;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          latitude: number | null;
          longitude: number | null;
          town: string | null;
          region: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          class_id: number;
          providerId?: string | null;
          session_id?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          town?: string | null;
          region?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          class_id?: number;
          providerId?: string | null;
          session_id?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          town?: string | null;
          region?: string | null;
          created_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_top_class_views: {
        Args: {
          limit_count?: number | null;
        };
        Returns: Array<{
          class_id: number;
          views: number;
        }>;
      };
      get_class_view_summary: {
        Args: Record<string, never>;
        Returns: Array<{
          date: string;
          views: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
