// Auto-generated shape (hand-authored from migrations until `supabase gen types` is wired).
// Regenerate with: npx supabase gen types typescript --db-url "$POSTGRES_URL_NON_POOLING" > src/types/database.types.ts
// (requires Docker or a Supabase personal access token)

// ---------------------------------------------------------------------------
// JSON scalar
// ---------------------------------------------------------------------------
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------------
// Standalone enum types (defined here to avoid circular self-references inside Database)
// ---------------------------------------------------------------------------
export type UserRole           = 'super_admin' | 'seller' | 'customer';
export type ListingPurpose     = 'sale' | 'rent' | 'lease';
export type PropertyCategory   = 'residential' | 'commercial' | 'land' | 'industrial' | 'agricultural';
export type FurnishingStatus   = 'unfurnished' | 'semi_furnished' | 'fully_furnished';
export type FacingDirection    = 'north' | 'south' | 'east' | 'west' | 'north_east' | 'north_west' | 'south_east' | 'south_west';
export type ConstructionStatus = 'ready_to_move' | 'under_construction' | 'new_launch';
export type OwnershipType      = 'freehold' | 'leasehold' | 'co_operative_society' | 'power_of_attorney';
export type PropertyStatus     = 'draft' | 'active' | 'sold' | 'rented' | 'inactive' | 'expired';
export type ApprovalStatus     = 'pending' | 'approved' | 'rejected';
export type KycStatus          = 'not_submitted' | 'submitted' | 'verified' | 'rejected';
export type MediaKind          = 'upload' | 'youtube';
export type InquirySource      = 'form' | 'whatsapp' | 'call' | 'chat';
export type InquiryStatus      = 'new' | 'contacted' | 'visit_scheduled' | 'negotiating' | 'closed_won' | 'closed_lost';
export type VisitStatus        = 'requested' | 'confirmed' | 'completed' | 'cancelled';
export type ContentStatus      = 'pending' | 'approved' | 'rejected';
export type BlogStatus         = 'draft' | 'published' | 'archived';
export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'cancelled';
export type PaymentStatus      = 'created' | 'pending' | 'paid' | 'failed' | 'refunded';
export type ReportStatus       = 'open' | 'resolved' | 'dismissed';
export type NearbyPlaceKind    = 'school' | 'hospital' | 'temple' | 'market' | 'metro' | 'railway' | 'bus_stop' | 'park' | 'bank' | 'other';
export type SellerType         = 'owner' | 'agent' | 'builder' | 'property_manager';
export type InstitutionType    = 'university' | 'college' | 'coaching_hub' | 'school';
export type RentalKind         = 'standard' | 'student';
export type GenderPolicy       = 'any' | 'boys_only' | 'girls_only' | 'family_only';
export type MealPlan           = 'none' | 'breakfast_only' | 'two_meals' | 'three_meals';
export type MessType           = 'veg' | 'veg_nonveg';
export type AlertFrequency     = 'instant' | 'daily' | 'off';
export type OutboxChannel      = 'in_app' | 'email' | 'whatsapp' | 'sms';
export type OutboxStatus       = 'pending' | 'sent' | 'failed' | 'cancelled';
export type MediaJobType       = 'thumbnail' | 'compress' | 'exif_strip' | 'watermark';
export type JobStatus          = 'queued' | 'processing' | 'done' | 'failed';
export type VerificationLevel  = 'l1_identity' | 'l2_property' | 'l3_trusted';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type TicketStatus       = 'open' | 'pending_user' | 'resolved' | 'closed';
export type TicketPriority     = 'low' | 'normal' | 'high' | 'urgent';
export type ListingEventType   = 'view' | 'gallery_open' | 'reveal' | 'whatsapp_click' | 'call_click' | 'share' | 'favorite' | 'visit_request';
export type OnboardingStage    = 'identified' | 'visited' | 'onboarded' | 'active';
export type PlanType           = 'subscription' | 'one_time';
export type PlanAudience       = 'agent' | 'owner' | 'operator';

// ---------------------------------------------------------------------------
// Database type
// ---------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {

      // -----------------------------------------------------------------------
      activity_logs: {
        Row: {
          id:          number;
          user_id:     string | null;
          action:      string;
          entity_type: string | null;
          entity_id:   string | null;
          meta:        Json;
          ip:          string | null;
          created_at:  string;
        };
        Insert: {
          id?:         never;
          user_id?:    string | null;
          action:      string;
          entity_type?: string | null;
          entity_id?:  string | null;
          meta?:       Json;
          ip?:         string | null;
          created_at?: string;
        };
        Update: {
          user_id?:    string | null;
          action?:     string;
          entity_type?: string | null;
          entity_id?:  string | null;
          meta?:       Json;
          ip?:         string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      amenities: {
        Row: {
          id:        number;
          name:      string;
          slug:      string;
          icon:      string | null;
          is_active: boolean;
        };
        Insert: {
          id?:       never;
          name:      string;
          slug:      string;
          icon?:     string | null;
          is_active?: boolean;
        };
        Update: {
          name?:     string;
          slug?:     string;
          icon?:     string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      areas: {
        Row: {
          id:         number;
          city_id:    number;
          name:       string;
          slug:       string;
          pincode:    string | null;
          latitude:   number | null;
          longitude:  number | null;
          is_active:  boolean;
          created_at: string;
        };
        Insert: {
          id?:        never;
          city_id:    number;
          name:       string;
          slug:       string;
          pincode?:   string | null;
          latitude?:  number | null;
          longitude?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          city_id?:   number;
          name?:      string;
          slug?:      string;
          pincode?:   string | null;
          latitude?:  number | null;
          longitude?: number | null;
          is_active?: boolean;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      audit_logs: {
        Row: {
          id:          number;
          actor_id:    string | null;
          action:      string;
          entity_type: string;
          entity_id:   string;
          old_data:    Json | null;
          new_data:    Json | null;
          created_at:  string;
        };
        Insert: {
          id?:         never;
          actor_id?:   string | null;
          action:      string;
          entity_type: string;
          entity_id:   string;
          old_data?:   Json | null;
          new_data?:   Json | null;
          created_at?: string;
        };
        Update: {
          actor_id?:   string | null;
          action?:     string;
          entity_type?: string;
          entity_id?:  string;
          old_data?:   Json | null;
          new_data?:   Json | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      banners: {
        Row: {
          id:         string;
          title:      string;
          image_path: string;
          link_url:   string | null;
          slot:       string;
          position:   number;
          is_active:  boolean;
          starts_at:  string | null;
          ends_at:    string | null;
          created_at: string;
        };
        Insert: {
          id?:        string;
          title:      string;
          image_path: string;
          link_url?:  string | null;
          slot:       string;
          position?:  number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?:   string | null;
          created_at?: string;
        };
        Update: {
          title?:     string;
          image_path?: string;
          link_url?:  string | null;
          slot?:      string;
          position?:  number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?:   string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      blocked_identifiers: {
        Row: {
          id:         number;
          kind:       string;
          value_hash: string;
          reason:     string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?:        never;
          kind:       string;
          value_hash: string;
          reason?:    string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          kind?:      string;
          value_hash?: string;
          reason?:    string | null;
          expires_at?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      blog_categories: {
        Row: {
          id:          number;
          name:        string;
          slug:        string;
          description: string | null;
        };
        Insert: {
          id?:         never;
          name:        string;
          slug:        string;
          description?: string | null;
        };
        Update: {
          name?:       string;
          slug?:       string;
          description?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      blog_comments: {
        Row: {
          id:         string;
          blog_id:    string;
          author_id:  string;
          body:       string;
          status:     ContentStatus;
          created_at: string;
        };
        Insert: {
          id?:        string;
          blog_id:    string;
          author_id:  string;
          body:       string;
          status?:    ContentStatus;
          created_at?: string;
        };
        Update: {
          body?:   string;
          status?: ContentStatus;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      blogs: {
        Row: {
          id:              string;
          author_id:       string | null;
          category_id:     number | null;
          title:           string;
          slug:            string;
          excerpt:         string | null;
          content:         string;
          cover_image_url: string | null;
          tags:            string[];
          status:          BlogStatus;
          views_count:     number;
          seo_title:       string | null;
          seo_description: string | null;
          published_at:    string | null;
          created_at:      string;
          updated_at:      string;
        };
        Insert: {
          id?:             string;
          author_id?:      string | null;
          category_id?:    number | null;
          title:           string;
          slug:            string;
          excerpt?:        string | null;
          content?:        string;
          cover_image_url?: string | null;
          tags?:           string[];
          status?:         BlogStatus;
          views_count?:    number;
          seo_title?:      string | null;
          seo_description?: string | null;
          published_at?:   string | null;
          created_at?:     string;
          updated_at?:     string;
        };
        Update: {
          author_id?:      string | null;
          category_id?:    number | null;
          title?:          string;
          slug?:           string;
          excerpt?:        string | null;
          content?:        string;
          cover_image_url?: string | null;
          tags?:           string[];
          status?:         BlogStatus;
          views_count?:    number;
          seo_title?:      string | null;
          seo_description?: string | null;
          published_at?:   string | null;
          updated_at?:     string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      cities: {
        Row: {
          id:              number;
          name:            string;
          slug:            string;
          district:        string;
          state:           string;
          country:         string;
          latitude:        number | null;
          longitude:       number | null;
          image_url:       string | null;
          is_active:       boolean;
          position:        number;
          seo_title:       string | null;
          seo_description: string | null;
          created_at:      string;
          region_id:       number | null;
        };
        Insert: {
          id?:             never;
          name:            string;
          slug:            string;
          district:        string;
          state:           string;
          country?:        string;
          latitude?:       number | null;
          longitude?:      number | null;
          image_url?:      string | null;
          is_active?:      boolean;
          position?:       number;
          seo_title?:      string | null;
          seo_description?: string | null;
          created_at?:     string;
          region_id?:      number | null;
        };
        Update: {
          name?:           string;
          slug?:           string;
          district?:       string;
          state?:          string;
          country?:        string;
          latitude?:       number | null;
          longitude?:      number | null;
          image_url?:      string | null;
          is_active?:      boolean;
          position?:       number;
          seo_title?:      string | null;
          seo_description?: string | null;
          region_id?:      number | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      comparisons: {
        Row: {
          id:           string;
          user_id:      string;
          property_ids: string[];
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:           string;
          user_id:       string;
          property_ids?: string[];
          created_at?:   string;
          updated_at?:   string;
        };
        Update: {
          property_ids?: string[];
          updated_at?:   string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      contact_messages: {
        Row: {
          id:         string;
          name:       string;
          email:      string;
          phone:      string | null;
          subject:    string | null;
          message:    string;
          is_read:    boolean;
          created_at: string;
        };
        Insert: {
          id?:      string;
          name:     string;
          email:    string;
          phone?:   string | null;
          subject?: string | null;
          message:  string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      contact_reveals: {
        Row: {
          user_id:     string;
          property_id: string;
          seller_id:   string;
          created_at:  string;
        };
        Insert: {
          user_id:     string;
          property_id: string;
          seller_id:   string;
          created_at?: string;
        };
        Update: {
          seller_id?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      conversations: {
        Row: {
          id:              string;
          seller_id:       string;
          customer_id:     string;
          property_id:     string | null;
          last_message_at: string | null;
          created_at:      string;
        };
        Insert: {
          id?:             string;
          seller_id:       string;
          customer_id:     string;
          property_id?:    string | null;
          last_message_at?: string | null;
          created_at?:     string;
        };
        Update: {
          last_message_at?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      favorites: {
        Row: {
          user_id:     string;
          property_id: string;
          created_at:  string;
        };
        Insert: {
          user_id:     string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      faqs: {
        Row: {
          id:        number;
          question:  string;
          answer:    string;
          category:  string | null;
          position:  number;
          is_active: boolean;
        };
        Insert: {
          id?:       never;
          question:  string;
          answer:    string;
          category?: string | null;
          position?: number;
          is_active?: boolean;
        };
        Update: {
          question?:  string;
          answer?:    string;
          category?:  string | null;
          position?:  number;
          is_active?: boolean;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      inquiries: {
        Row: {
          id:          string;
          property_id: string | null;
          seller_id:   string;
          customer_id: string | null;
          name:        string;
          email:       string | null;
          phone:       string;
          message:     string | null;
          source:      InquirySource;
          status:      InquiryStatus;
          notes:       string | null;
          created_at:  string;
          updated_at:  string;
        };
        Insert: {
          id?:          string;
          property_id?: string | null;
          seller_id:    string;
          customer_id?: string | null;
          name:         string;
          email?:       string | null;
          phone:        string;
          message?:     string | null;
          source?:      InquirySource;
          status?:      InquiryStatus;
          notes?:       string | null;
          created_at?:  string;
          updated_at?:  string;
        };
        Update: {
          property_id?: string | null;
          seller_id?:   string;
          customer_id?: string | null;
          name?:        string;
          email?:       string | null;
          phone?:       string;
          message?:     string | null;
          source?:      InquirySource;
          status?:      InquiryStatus;
          notes?:       string | null;
          updated_at?:  string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      invoices: {
        Row: {
          id:             string;
          payment_id:     string;
          invoice_number: string;
          pdf_path:       string | null;
          issued_at:      string;
        };
        Insert: {
          id?:             string;
          payment_id:      string;
          invoice_number:  string;
          pdf_path?:       string | null;
          issued_at?:      string;
        };
        Update: {
          pdf_path?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      kyc_documents: {
        Row: {
          id:          string;
          seller_id:   string;
          doc_type:    string;
          file_path:   string;
          status:      ContentStatus;
          remarks:     string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          seller_id:    string;
          doc_type:     string;
          file_path:    string;
          status?:      ContentStatus;
          remarks?:     string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?:  string;
        };
        Update: {
          doc_type?:    string;
          file_path?:   string;
          status?:      ContentStatus;
          remarks?:     string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      listing_events: {
        Row: {
          id:          number;
          property_id: string;
          user_id:     string | null;
          session_id:  string | null;
          event_type:  ListingEventType;
          source:      string | null;
          created_at:  string;
        };
        Insert: {
          id?:         never;
          property_id: string;
          user_id?:    string | null;
          session_id?: string | null;
          event_type:  ListingEventType;
          source?:     string | null;
          created_at?: string;
        };
        Update: {
          source?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      media_jobs: {
        Row: {
          id:         string;
          bucket:     string;
          path:       string;
          job:        MediaJobType;
          status:     JobStatus;
          attempts:   number;
          error:      string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:        string;
          bucket:     string;
          path:       string;
          job:        MediaJobType;
          status?:    JobStatus;
          attempts?:  number;
          error?:     string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?:    JobStatus;
          attempts?:  number;
          error?:     string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      messages: {
        Row: {
          id:              string;
          conversation_id: string;
          sender_id:       string;
          body:            string;
          read_at:         string | null;
          created_at:      string;
        };
        Insert: {
          id?:             string;
          conversation_id: string;
          sender_id:       string;
          body:            string;
          read_at?:        string | null;
          created_at?:     string;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      nearby_places: {
        Row: {
          id:          string;
          property_id: string;
          kind:        NearbyPlaceKind;
          name:        string;
          distance_km: number | null;
        };
        Insert: {
          id?:          string;
          property_id:  string;
          kind:         NearbyPlaceKind;
          name:         string;
          distance_km?: number | null;
        };
        Update: {
          kind?:        NearbyPlaceKind;
          name?:        string;
          distance_km?: number | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      newsletter_subscribers: {
        Row: {
          id:               string;
          email:            string;
          unsubscribed_at:  string | null;
          created_at:       string;
        };
        Insert: {
          id?:              string;
          email:            string;
          unsubscribed_at?: string | null;
          created_at?:      string;
        };
        Update: {
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      notification_outbox: {
        Row: {
          id:            string;
          user_id:       string;
          channel:       OutboxChannel;
          template:      string;
          payload:       Json;
          status:        OutboxStatus;
          attempts:      number;
          next_retry_at: string | null;
          sent_at:       string | null;
          created_at:    string;
        };
        Insert: {
          id?:            string;
          user_id:        string;
          channel:        OutboxChannel;
          template:       string;
          payload?:       Json;
          status?:        OutboxStatus;
          attempts?:      number;
          next_retry_at?: string | null;
          sent_at?:       string | null;
          created_at?:    string;
        };
        Update: {
          channel?:       OutboxChannel;
          template?:      string;
          payload?:       Json;
          status?:        OutboxStatus;
          attempts?:      number;
          next_retry_at?: string | null;
          sent_at?:       string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      notifications: {
        Row: {
          id:         string;
          user_id:    string;
          type:       string;
          title:      string;
          body:       string | null;
          payload:    Json;
          read_at:    string | null;
          created_at: string;
        };
        Insert: {
          id?:      string;
          user_id:  string;
          type:     string;
          title:    string;
          body?:    string | null;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          type?:    string;
          title?:   string;
          body?:    string | null;
          payload?: Json;
          read_at?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      payments: {
        Row: {
          id:                  string;
          seller_id:           string;
          subscription_id:     string | null;
          amount:              number;
          currency:            string;
          gateway:             string;
          gateway_order_id:    string | null;
          gateway_payment_id:  string | null;
          status:              PaymentStatus;
          meta:                Json;
          created_at:          string;
          updated_at:          string;
        };
        Insert: {
          id?:                  string;
          seller_id:            string;
          subscription_id?:     string | null;
          amount:               number;
          currency?:            string;
          gateway:              string;
          gateway_order_id?:    string | null;
          gateway_payment_id?:  string | null;
          status?:              PaymentStatus;
          meta?:                Json;
          created_at?:          string;
          updated_at?:          string;
        };
        Update: {
          subscription_id?:     string | null;
          amount?:              number;
          currency?:            string;
          gateway?:             string;
          gateway_order_id?:    string | null;
          gateway_payment_id?:  string | null;
          status?:              PaymentStatus;
          meta?:                Json;
          updated_at?:          string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      price_history: {
        Row: {
          id:          number;
          property_id: string;
          old_price:   number | null;
          new_price:   number;
          changed_at:  string;
        };
        Insert: {
          id?:         never;
          property_id: string;
          old_price?:  number | null;
          new_price:   number;
          changed_at?: string;
        };
        Update: {
          old_price?: number | null;
          new_price?: number;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      profiles: {
        Row: {
          id:                  string;
          role:                UserRole;
          full_name:           string;
          email:               string | null;
          phone:               string | null;
          avatar_url:          string | null;
          is_active:           boolean;
          last_seen_at:        string | null;
          created_at:          string;
          updated_at:          string;
          phone_verified_at:   string | null;
        };
        Insert: {
          id:                  string;
          role?:               UserRole;
          full_name?:          string;
          email?:              string | null;
          phone?:              string | null;
          avatar_url?:         string | null;
          is_active?:          boolean;
          last_seen_at?:       string | null;
          created_at?:         string;
          updated_at?:         string;
          phone_verified_at?:  string | null;
        };
        Update: {
          role?:               UserRole;
          full_name?:          string;
          email?:              string | null;
          phone?:              string | null;
          avatar_url?:         string | null;
          is_active?:          boolean;
          last_seen_at?:       string | null;
          updated_at?:         string;
          phone_verified_at?:  string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      properties: {
        Row: {
          id:                  string;
          seller_id:           string;
          title:               string;
          slug:                string;
          description:         string;
          property_type_id:    number;
          purpose:             ListingPurpose;
          price:               number;
          price_per_sqft:      number | null;
          is_negotiable:       boolean;
          maintenance_charge:  number | null;
          security_deposit:    number | null;
          address:             string;
          landmark:            string | null;
          city_id:             number;
          area_id:             number | null;
          state:               string;
          country:             string;
          pincode:             string | null;
          latitude:            number | null;
          longitude:           number | null;
          location:            string | null;   // generated geography column
          built_up_area:       number | null;
          carpet_area:         number | null;
          plot_area:           number | null;
          area_unit:           string;
          bedrooms:            number | null;
          bathrooms:           number | null;
          balconies:           number | null;
          kitchens:            number | null;
          floor_number:        number | null;
          total_floors:        number | null;
          parking_spaces:      number;
          facing:              FacingDirection | null;
          property_age_years:  number | null;
          construction_status: ConstructionStatus | null;
          possession_date:     string | null;
          ownership:           OwnershipType | null;
          furnishing:          FurnishingStatus | null;
          youtube_url:         string | null;
          virtual_tour_url:    string | null;
          brochure_path:       string | null;
          status:              PropertyStatus;
          approval_status:     ApprovalStatus;
          rejection_reason:    string | null;
          approved_by:         string | null;
          approved_at:         string | null;
          is_featured:         boolean;
          is_premium:          boolean;
          is_sponsored:        boolean;
          featured_until:      string | null;
          views_count:         number;
          favorites_count:     number;
          inquiries_count:     number;
          seo_title:           string | null;
          seo_description:     string | null;
          og_image_url:        string | null;
          fts:                 string | null;  // generated tsvector
          published_at:        string | null;
          expires_at:          string | null;
          created_at:          string;
          updated_at:          string;
          rental_kind:         RentalKind | null;
          gender_policy:       GenderPolicy;
          preferred_tenants:   string[];
          available_from:      string | null;
          lock_in_months:      number | null;
          curfew_time:         string | null;
          has_warden:          boolean | null;
          mess_type:           MessType | null;
          quality_score:       number;
          risk_score:          number;
          deleted_at:          string | null;
        };
        Insert: {
          id?:                  string;
          seller_id:            string;
          title:                string;
          slug:                 string;
          description?:         string;
          property_type_id:     number;
          purpose:              ListingPurpose;
          price:                number;
          price_per_sqft?:      number | null;
          is_negotiable?:       boolean;
          maintenance_charge?:  number | null;
          security_deposit?:    number | null;
          address:              string;
          landmark?:            string | null;
          city_id:              number;
          area_id?:             number | null;
          state?:               string;
          country?:             string;
          pincode?:             string | null;
          latitude?:            number | null;
          longitude?:           number | null;
          built_up_area?:       number | null;
          carpet_area?:         number | null;
          plot_area?:           number | null;
          area_unit?:           string;
          bedrooms?:            number | null;
          bathrooms?:           number | null;
          balconies?:           number | null;
          kitchens?:            number | null;
          floor_number?:        number | null;
          total_floors?:        number | null;
          parking_spaces?:      number;
          facing?:              FacingDirection | null;
          property_age_years?:  number | null;
          construction_status?: ConstructionStatus | null;
          possession_date?:     string | null;
          ownership?:           OwnershipType | null;
          furnishing?:          FurnishingStatus | null;
          youtube_url?:         string | null;
          virtual_tour_url?:    string | null;
          brochure_path?:       string | null;
          status?:              PropertyStatus;
          approval_status?:     ApprovalStatus;
          rejection_reason?:    string | null;
          approved_by?:         string | null;
          approved_at?:         string | null;
          is_featured?:         boolean;
          is_premium?:          boolean;
          is_sponsored?:        boolean;
          featured_until?:      string | null;
          views_count?:         number;
          favorites_count?:     number;
          inquiries_count?:     number;
          seo_title?:           string | null;
          seo_description?:     string | null;
          og_image_url?:        string | null;
          published_at?:        string | null;
          expires_at?:          string | null;
          created_at?:          string;
          updated_at?:          string;
          rental_kind?:         RentalKind | null;
          gender_policy?:       GenderPolicy;
          preferred_tenants?:   string[];
          available_from?:      string | null;
          lock_in_months?:      number | null;
          curfew_time?:         string | null;
          has_warden?:          boolean | null;
          mess_type?:           MessType | null;
          quality_score?:       number;
          risk_score?:          number;
          deleted_at?:          string | null;
        };
        Update: {
          seller_id?:           string;
          title?:               string;
          slug?:                string;
          description?:         string;
          property_type_id?:    number;
          purpose?:             ListingPurpose;
          price?:               number;
          price_per_sqft?:      number | null;
          is_negotiable?:       boolean;
          maintenance_charge?:  number | null;
          security_deposit?:    number | null;
          address?:             string;
          landmark?:            string | null;
          city_id?:             number;
          area_id?:             number | null;
          state?:               string;
          country?:             string;
          pincode?:             string | null;
          latitude?:            number | null;
          longitude?:           number | null;
          built_up_area?:       number | null;
          carpet_area?:         number | null;
          plot_area?:           number | null;
          area_unit?:           string;
          bedrooms?:            number | null;
          bathrooms?:           number | null;
          balconies?:           number | null;
          kitchens?:            number | null;
          floor_number?:        number | null;
          total_floors?:        number | null;
          parking_spaces?:      number;
          facing?:              FacingDirection | null;
          property_age_years?:  number | null;
          construction_status?: ConstructionStatus | null;
          possession_date?:     string | null;
          ownership?:           OwnershipType | null;
          furnishing?:          FurnishingStatus | null;
          youtube_url?:         string | null;
          virtual_tour_url?:    string | null;
          brochure_path?:       string | null;
          status?:              PropertyStatus;
          approval_status?:     ApprovalStatus;
          rejection_reason?:    string | null;
          approved_by?:         string | null;
          approved_at?:         string | null;
          is_featured?:         boolean;
          is_premium?:          boolean;
          is_sponsored?:        boolean;
          featured_until?:      string | null;
          views_count?:         number;
          favorites_count?:     number;
          inquiries_count?:     number;
          seo_title?:           string | null;
          seo_description?:     string | null;
          og_image_url?:        string | null;
          published_at?:        string | null;
          expires_at?:          string | null;
          updated_at?:          string;
          rental_kind?:         RentalKind | null;
          gender_policy?:       GenderPolicy;
          preferred_tenants?:   string[];
          available_from?:      string | null;
          lock_in_months?:      number | null;
          curfew_time?:         string | null;
          has_warden?:          boolean | null;
          mess_type?:           MessType | null;
          quality_score?:       number;
          risk_score?:          number;
          deleted_at?:          string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      property_amenities: {
        Row: {
          property_id: string;
          amenity_id:  number;
        };
        Insert: {
          property_id: string;
          amenity_id:  number;
        };
        Update: {
          property_id?: string;
          amenity_id?:  number;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      property_documents: {
        Row: {
          id:          string;
          property_id: string;
          name:        string;
          doc_type:    string;
          file_path:   string;
          created_at:  string;
        };
        Insert: {
          id?:         string;
          property_id: string;
          name:        string;
          doc_type:    string;
          file_path:   string;
          created_at?: string;
        };
        Update: {
          name?:     string;
          doc_type?: string;
          file_path?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      property_images: {
        Row: {
          id:             string;
          property_id:    string;
          path:           string;
          thumbnail_path: string | null;
          alt_text:       string | null;
          position:       number;
          is_cover:       boolean;
          width:          number | null;
          height:         number | null;
          size_bytes:     number | null;
          created_at:     string;
        };
        Insert: {
          id?:             string;
          property_id:     string;
          path:            string;
          thumbnail_path?: string | null;
          alt_text?:       string | null;
          position?:       number;
          is_cover?:       boolean;
          width?:          number | null;
          height?:         number | null;
          size_bytes?:     number | null;
          created_at?:     string;
        };
        Update: {
          path?:           string;
          thumbnail_path?: string | null;
          alt_text?:       string | null;
          position?:       number;
          is_cover?:       boolean;
          width?:          number | null;
          height?:         number | null;
          size_bytes?:     number | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      property_reports: {
        Row: {
          id:          string;
          property_id: string;
          reporter_id: string | null;
          reason:      string;
          details:     string | null;
          status:      ReportStatus;
          resolved_by: string | null;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          property_id:  string;
          reporter_id?: string | null;
          reason:       string;
          details?:     string | null;
          status?:      ReportStatus;
          resolved_by?: string | null;
          created_at?:  string;
        };
        Update: {
          reason?:      string;
          details?:     string | null;
          status?:      ReportStatus;
          resolved_by?: string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      property_slugs: {
        Row: {
          old_slug:    string;
          property_id: string;
          created_at:  string;
        };
        Insert: {
          old_slug:    string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          property_id?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      property_types: {
        Row: {
          id:        number;
          name:      string;
          slug:      string;
          category:  PropertyCategory;
          icon:      string | null;
          is_active: boolean;
          position:  number;
        };
        Insert: {
          id?:       never;
          name:      string;
          slug:      string;
          category:  PropertyCategory;
          icon?:     string | null;
          is_active?: boolean;
          position?: number;
        };
        Update: {
          name?:     string;
          slug?:     string;
          category?: PropertyCategory;
          icon?:     string | null;
          is_active?: boolean;
          position?: number;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      property_universities: {
        Row: {
          property_id:         string;
          university_id:       number;
          computed_distance_m: number | null;
          created_at:          string;
        };
        Insert: {
          property_id:          string;
          university_id:        number;
          computed_distance_m?: number | null;
          created_at?:          string;
        };
        Update: {
          computed_distance_m?: number | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      property_videos: {
        Row: {
          id:             string;
          property_id:    string;
          kind:           MediaKind;
          url:            string;
          thumbnail_path: string | null;
          position:       number;
          created_at:     string;
        };
        Insert: {
          id?:             string;
          property_id:     string;
          kind?:           MediaKind;
          url:             string;
          thumbnail_path?: string | null;
          position?:       number;
          created_at?:     string;
        };
        Update: {
          kind?:           MediaKind;
          url?:            string;
          thumbnail_path?: string | null;
          position?:       number;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      recently_viewed: {
        Row: {
          user_id:     string;
          property_id: string;
          viewed_at:   string;
        };
        Insert: {
          user_id:     string;
          property_id: string;
          viewed_at?:  string;
        };
        Update: {
          viewed_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      regions: {
        Row: {
          id:        number;
          name:      string;
          slug:      string;
          is_active: boolean;
          position:  number;
        };
        Insert: {
          id?:       never;
          name:      string;
          slug:      string;
          is_active?: boolean;
          position?: number;
        };
        Update: {
          name?:     string;
          slug?:     string;
          is_active?: boolean;
          position?: number;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      reviews: {
        Row: {
          id:          string;
          seller_id:   string;
          property_id: string | null;
          author_id:   string;
          rating:      number;
          title:       string | null;
          comment:     string;
          status:      ContentStatus;
          created_at:  string;
          lead_id:     string | null;
        };
        Insert: {
          id?:          string;
          seller_id:    string;
          property_id?: string | null;
          author_id:    string;
          rating:       number;
          title?:       string | null;
          comment:      string;
          status?:      ContentStatus;
          created_at?:  string;
          lead_id?:     string | null;
        };
        Update: {
          seller_id?:   string;
          property_id?: string | null;
          rating?:      number;
          title?:       string | null;
          comment?:     string;
          status?:      ContentStatus;
          lead_id?:     string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      room_types: {
        Row: {
          id:                    string;
          property_id:           string;
          name:                  string | null;
          sharing_count:         number;
          monthly_rent_per_bed:  number;
          security_deposit:      number | null;
          is_ac:                 boolean;
          meal_plan:             MealPlan;
          attached_bathroom:     boolean;
          total_beds:            number | null;
          available_beds:        number;
          is_active:             boolean;
          created_at:            string;
          updated_at:            string;
        };
        Insert: {
          id?:                    string;
          property_id:            string;
          name?:                  string | null;
          sharing_count:          number;
          monthly_rent_per_bed:   number;
          security_deposit?:      number | null;
          is_ac?:                 boolean;
          meal_plan?:             MealPlan;
          attached_bathroom?:     boolean;
          total_beds?:            number | null;
          available_beds?:        number;
          is_active?:             boolean;
          created_at?:            string;
          updated_at?:            string;
        };
        Update: {
          name?:                  string | null;
          sharing_count?:         number;
          monthly_rent_per_bed?:  number;
          security_deposit?:      number | null;
          is_ac?:                 boolean;
          meal_plan?:             MealPlan;
          attached_bathroom?:     boolean;
          total_beds?:            number | null;
          available_beds?:        number;
          is_active?:             boolean;
          updated_at?:            string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      saved_searches: {
        Row: {
          id:              string;
          user_id:         string;
          name:            string;
          purpose:         ListingPurpose | null;
          filters:         Json;
          frequency:       AlertFrequency;
          email_alerts:    boolean;
          last_alerted_at: string | null;
          created_at:      string;
          updated_at:      string;
        };
        Insert: {
          id?:              string;
          user_id:          string;
          name:             string;
          purpose?:         ListingPurpose | null;
          filters?:         Json;
          frequency?:       AlertFrequency;
          email_alerts?:    boolean;
          last_alerted_at?: string | null;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: {
          name?:            string;
          purpose?:         ListingPurpose | null;
          filters?:         Json;
          frequency?:       AlertFrequency;
          email_alerts?:    boolean;
          last_alerted_at?: string | null;
          updated_at?:      string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      search_events: {
        Row: {
          id:           number;
          user_id:      string | null;
          session_id:   string | null;
          purpose:      ListingPurpose | null;
          city_id:      number | null;
          area_id:      number | null;
          filters:      Json;
          result_count: number;
          zero_results: boolean;  // generated column
          created_at:   string;
        };
        Insert: {
          id?:           never;
          user_id?:      string | null;
          session_id?:   string | null;
          purpose?:      ListingPurpose | null;
          city_id?:      number | null;
          area_id?:      number | null;
          filters?:      Json;
          result_count?: number;
          created_at?:   string;
        };
        Update: {
          user_id?:      string | null;
          session_id?:   string | null;
          purpose?:      ListingPurpose | null;
          city_id?:      number | null;
          area_id?:      number | null;
          filters?:      Json;
          result_count?: number;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      seller_onboarding: {
        Row: {
          id:              string;
          prospect_name:   string;
          prospect_phone:  string;
          seller_type:     SellerType;
          city_id:         number | null;
          locality_note:   string | null;
          stage:           OnboardingStage;
          assignee_id:     string | null;
          notes:           string | null;
          next_action_at:  string | null;
          seller_id:       string | null;
          created_at:      string;
          updated_at:      string;
        };
        Insert: {
          id?:              string;
          prospect_name:    string;
          prospect_phone:   string;
          seller_type?:     SellerType;
          city_id?:         number | null;
          locality_note?:   string | null;
          stage?:           OnboardingStage;
          assignee_id?:     string | null;
          notes?:           string | null;
          next_action_at?:  string | null;
          seller_id?:       string | null;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: {
          prospect_name?:   string;
          prospect_phone?:  string;
          seller_type?:     SellerType;
          city_id?:         number | null;
          locality_note?:   string | null;
          stage?:           OnboardingStage;
          assignee_id?:     string | null;
          notes?:           string | null;
          next_action_at?:  string | null;
          seller_id?:       string | null;
          updated_at?:      string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      sellers: {
        Row: {
          id:               string;
          business_name:    string | null;
          slug:             string;
          about:            string | null;
          experience_years: number | null;
          office_address:   string | null;
          city_id:          number | null;
          whatsapp_number:  string | null;
          website:          string | null;
          logo_url:         string | null;
          cover_image_url:  string | null;
          rera_number:      string | null;
          kyc_status:       KycStatus;
          is_verified:      boolean;
          verified_at:      string | null;
          avg_rating:       number;
          total_reviews:    number;
          created_at:       string;
          updated_at:       string;
          seller_type:      SellerType;
        };
        Insert: {
          id:               string;
          business_name?:   string | null;
          slug:             string;
          about?:           string | null;
          experience_years?: number | null;
          office_address?:  string | null;
          city_id?:         number | null;
          whatsapp_number?: string | null;
          website?:         string | null;
          logo_url?:        string | null;
          cover_image_url?: string | null;
          rera_number?:     string | null;
          kyc_status?:      KycStatus;
          is_verified?:     boolean;
          verified_at?:     string | null;
          avg_rating?:      number;
          total_reviews?:   number;
          created_at?:      string;
          updated_at?:      string;
          seller_type?:     SellerType;
        };
        Update: {
          business_name?:   string | null;
          slug?:            string;
          about?:           string | null;
          experience_years?: number | null;
          office_address?:  string | null;
          city_id?:         number | null;
          whatsapp_number?: string | null;
          website?:         string | null;
          logo_url?:        string | null;
          cover_image_url?: string | null;
          rera_number?:     string | null;
          kyc_status?:      KycStatus;
          is_verified?:     boolean;
          verified_at?:     string | null;
          avg_rating?:      number;
          total_reviews?:   number;
          updated_at?:      string;
          seller_type?:     SellerType;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      site_settings: {
        Row: {
          key:        string;
          value:      Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key:        string;
          value:      Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          value?:      Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      strikes: {
        Row: {
          id:          number;
          user_id:     string;
          reason_code: string;
          details:     string | null;
          evidence:    Json;
          issued_by:   string | null;
          expires_at:  string | null;
          created_at:  string;
        };
        Insert: {
          id?:         never;
          user_id:     string;
          reason_code: string;
          details?:    string | null;
          evidence?:   Json;
          issued_by?:  string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          reason_code?: string;
          details?:     string | null;
          evidence?:    Json;
          issued_by?:   string | null;
          expires_at?:  string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      subscription_plans: {
        Row: {
          id:             number;
          name:           string;
          slug:           string;
          description:    string | null;
          price:          number;
          currency:       string;
          duration_days:  number;
          listing_limit:  number;
          featured_limit: number;
          features:       Json;
          is_active:      boolean;
          position:       number;
          created_at:     string;
          plan_type:      PlanType;
          audience:       PlanAudience;
        };
        Insert: {
          id?:             never;
          name:            string;
          slug:            string;
          description?:    string | null;
          price:           number;
          currency?:       string;
          duration_days:   number;
          listing_limit?:  number;
          featured_limit?: number;
          features?:       Json;
          is_active?:      boolean;
          position?:       number;
          created_at?:     string;
          plan_type?:      PlanType;
          audience?:       PlanAudience;
        };
        Update: {
          name?:           string;
          slug?:           string;
          description?:    string | null;
          price?:          number;
          currency?:       string;
          duration_days?:  number;
          listing_limit?:  number;
          featured_limit?: number;
          features?:       Json;
          is_active?:      boolean;
          position?:       number;
          plan_type?:      PlanType;
          audience?:       PlanAudience;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      subscriptions: {
        Row: {
          id:             string;
          seller_id:      string;
          plan_id:        number;
          status:         SubscriptionStatus;
          starts_at:      string;
          ends_at:        string;
          listings_used:  number;
          featured_used:  number;
          created_at:     string;
        };
        Insert: {
          id?:             string;
          seller_id:       string;
          plan_id:         number;
          status?:         SubscriptionStatus;
          starts_at?:      string;
          ends_at:         string;
          listings_used?:  number;
          featured_used?:  number;
          created_at?:     string;
        };
        Update: {
          plan_id?:        number;
          status?:         SubscriptionStatus;
          starts_at?:      string;
          ends_at?:        string;
          listings_used?:  number;
          featured_used?:  number;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      support_tickets: {
        Row: {
          id:                 string;
          requester_id:       string | null;
          contact_name:       string | null;
          contact_phone:      string | null;
          contact_email:      string | null;
          channel:            string;
          category:           string;
          priority:           TicketPriority;
          status:             TicketStatus;
          assignee_id:        string | null;
          subject:            string;
          first_response_at:  string | null;
          resolved_at:        string | null;
          created_at:         string;
          updated_at:         string;
        };
        Insert: {
          id?:                 string;
          requester_id?:       string | null;
          contact_name?:       string | null;
          contact_phone?:      string | null;
          contact_email?:      string | null;
          channel?:            string;
          category?:           string;
          priority?:           TicketPriority;
          status?:             TicketStatus;
          assignee_id?:        string | null;
          subject:             string;
          first_response_at?:  string | null;
          resolved_at?:        string | null;
          created_at?:         string;
          updated_at?:         string;
        };
        Update: {
          requester_id?:       string | null;
          contact_name?:       string | null;
          contact_phone?:      string | null;
          contact_email?:      string | null;
          channel?:            string;
          category?:           string;
          priority?:           TicketPriority;
          status?:             TicketStatus;
          assignee_id?:        string | null;
          subject?:            string;
          first_response_at?:  string | null;
          resolved_at?:        string | null;
          updated_at?:         string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      testimonials: {
        Row: {
          id:         string;
          name:       string;
          role_label: string | null;
          avatar_url: string | null;
          quote:      string;
          rating:     number | null;
          is_active:  boolean;
          position:   number;
          created_at: string;
        };
        Insert: {
          id?:        string;
          name:       string;
          role_label?: string | null;
          avatar_url?: string | null;
          quote:      string;
          rating?:    number | null;
          is_active?: boolean;
          position?:  number;
          created_at?: string;
        };
        Update: {
          name?:       string;
          role_label?: string | null;
          avatar_url?: string | null;
          quote?:      string;
          rating?:     number | null;
          is_active?:  boolean;
          position?:   number;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      ticket_messages: {
        Row: {
          id:          string;
          ticket_id:   string;
          author_id:   string | null;
          is_internal: boolean;
          body:        string;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          ticket_id:    string;
          author_id?:   string | null;
          is_internal?: boolean;
          body:         string;
          created_at?:  string;
        };
        Update: {
          is_internal?: boolean;
          body?:        string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      universities: {
        Row: {
          id:               number;
          name:             string;
          slug:             string;
          aliases:          string[];
          institution_type: InstitutionType;
          city_id:          number;
          address:          string | null;
          latitude:         number | null;
          longitude:        number | null;
          location:         string | null;  // generated geography column
          logo_url:         string | null;
          website:          string | null;
          is_active:        boolean;
          seo_title:        string | null;
          seo_description:  string | null;
          created_at:       string;
        };
        Insert: {
          id?:               never;
          name:              string;
          slug:              string;
          aliases?:          string[];
          institution_type?: InstitutionType;
          city_id:           number;
          address?:          string | null;
          latitude?:         number | null;
          longitude?:        number | null;
          logo_url?:         string | null;
          website?:          string | null;
          is_active?:        boolean;
          seo_title?:        string | null;
          seo_description?:  string | null;
          created_at?:       string;
        };
        Update: {
          name?:             string;
          slug?:             string;
          aliases?:          string[];
          institution_type?: InstitutionType;
          city_id?:          number;
          address?:          string | null;
          latitude?:         number | null;
          longitude?:        number | null;
          logo_url?:         string | null;
          website?:          string | null;
          is_active?:        boolean;
          seo_title?:        string | null;
          seo_description?:  string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      user_blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      verification_requests: {
        Row: {
          id:          string;
          seller_id:   string | null;
          property_id: string | null;
          level:       VerificationLevel;
          status:      VerificationStatus;
          evidence:    Json;
          reviewer_id: string | null;
          reason:      string | null;
          reviewed_at: string | null;
          expires_at:  string | null;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          seller_id?:   string | null;
          property_id?: string | null;
          level:        VerificationLevel;
          status?:      VerificationStatus;
          evidence?:    Json;
          reviewer_id?: string | null;
          reason?:      string | null;
          reviewed_at?: string | null;
          expires_at?:  string | null;
          created_at?:  string;
        };
        Update: {
          seller_id?:   string | null;
          property_id?: string | null;
          level?:       VerificationLevel;
          status?:      VerificationStatus;
          evidence?:    Json;
          reviewer_id?: string | null;
          reason?:      string | null;
          reviewed_at?: string | null;
          expires_at?:  string | null;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      visit_appointments: {
        Row: {
          id:           string;
          property_id:  string;
          seller_id:    string;
          customer_id:  string;
          scheduled_at: string;
          status:       VisitStatus;
          notes:        string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:           string;
          property_id:   string;
          seller_id:     string;
          customer_id:   string;
          scheduled_at:  string;
          status?:       VisitStatus;
          notes?:        string | null;
          created_at?:   string;
          updated_at?:   string;
        };
        Update: {
          scheduled_at?: string;
          status?:       VisitStatus;
          notes?:        string | null;
          updated_at?:   string;
        };
        Relationships: [];
      };

      // -----------------------------------------------------------------------
      webhook_events: {
        Row: {
          id:           number;
          provider:     string;
          event_id:     string;
          payload:      Json;
          processed_at: string | null;
          created_at:   string;
        };
        Insert: {
          id?:           never;
          provider:      string;
          event_id:      string;
          payload?:      Json;
          processed_at?: string | null;
          created_at?:   string;
        };
        Update: {
          payload?:      Json;
          processed_at?: string | null;
        };
        Relationships: [];
      };

    }; // end Tables

    Views: Record<string, never>;

    Functions: {
      is_admin:          { Args: Record<string, never>; Returns: boolean };
      is_seller:         { Args: Record<string, never>; Returns: boolean };
      increment_property_views: { Args: { p_property_id: string }; Returns: void };
      nearby_properties: { Args: { p_lat: number; p_lng: number; p_radius_m?: number }; Returns: Database['public']['Tables']['properties']['Row'][] };
    };

    Enums: {
      user_role:            UserRole;
      listing_purpose:      ListingPurpose;
      property_category:    PropertyCategory;
      furnishing_status:    FurnishingStatus;
      facing_direction:     FacingDirection;
      construction_status:  ConstructionStatus;
      ownership_type:       OwnershipType;
      property_status:      PropertyStatus;
      approval_status:      ApprovalStatus;
      kyc_status:           KycStatus;
      media_kind:           MediaKind;
      inquiry_source:       InquirySource;
      inquiry_status:       InquiryStatus;
      visit_status:         VisitStatus;
      content_status:       ContentStatus;
      blog_status:          BlogStatus;
      subscription_status:  SubscriptionStatus;
      payment_status:       PaymentStatus;
      report_status:        ReportStatus;
      nearby_place_kind:    NearbyPlaceKind;
      seller_type:          SellerType;
      institution_type:     InstitutionType;
      rental_kind:          RentalKind;
      gender_policy:        GenderPolicy;
      meal_plan:            MealPlan;
      mess_type:            MessType;
      alert_frequency:      AlertFrequency;
      outbox_channel:       OutboxChannel;
      outbox_status:        OutboxStatus;
      media_job_type:       MediaJobType;
      job_status:           JobStatus;
      verification_level:   VerificationLevel;
      verification_status:  VerificationStatus;
      ticket_status:        TicketStatus;
      ticket_priority:      TicketPriority;
      listing_event_type:   ListingEventType;
      onboarding_stage:     OnboardingStage;
      plan_type:            PlanType;
      plan_audience:        PlanAudience;
    };

    CompositeTypes: Record<string, never>;
  };
};

// ---------------------------------------------------------------------------
// Utility helpers (mirrors Supabase codegen output)
// ---------------------------------------------------------------------------
type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];

export type InsertTables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];

export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T];

// ---------------------------------------------------------------------------
// Named row shortcuts
// ---------------------------------------------------------------------------
export type Profile              = Tables<'profiles'>;
export type Seller               = Tables<'sellers'>;
export type Property             = Tables<'properties'>;
export type PropertyImage        = Tables<'property_images'>;
export type PropertyVideo        = Tables<'property_videos'>;
export type PropertyType         = Tables<'property_types'>;
export type City                 = Tables<'cities'>;
export type Area                 = Tables<'areas'>;
export type Region               = Tables<'regions'>;
export type University           = Tables<'universities'>;
export type RoomType             = Tables<'room_types'>;
export type Inquiry              = Tables<'inquiries'>;
export type VisitAppointment     = Tables<'visit_appointments'>;
export type Conversation         = Tables<'conversations'>;
export type Message              = Tables<'messages'>;
export type Notification         = Tables<'notifications'>;
export type SavedSearch          = Tables<'saved_searches'>;
export type Subscription         = Tables<'subscriptions'>;
export type SubscriptionPlan     = Tables<'subscription_plans'>;
export type Payment              = Tables<'payments'>;
export type SupportTicket        = Tables<'support_tickets'>;
export type TicketMessage        = Tables<'ticket_messages'>;
export type VerificationRequest  = Tables<'verification_requests'>;
export type NotificationOutbox   = Tables<'notification_outbox'>;
