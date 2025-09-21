// Minimal Database types for Supabase client generics
// Keep in sync with SUPABASE.md schema definitions

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          slug: string | null;
          title: string;
          description: string | null;
          location: string;
          starts_at: string; // timestamptz ISO
          owner_id: string;
          created_at: string;
          cover_url: string | null;
        };
        Insert: {
          id?: string;
          slug?: string | null;
          title: string;
          description?: string | null;
          location: string;
          starts_at: string;
          owner_id: string;
          created_at?: string;
          cover_url?: string | null;
        };
        Update: {
          id?: string;
          slug?: string | null;
          title?: string;
          description?: string | null;
          location?: string;
          starts_at?: string;
          owner_id?: string;
          created_at?: string;
          cover_url?: string | null;
        };
        Relationships: [];
      };
      event_images: {
        Row: {
          id: string;
          event_id: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          name_lc: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          // name_lc is generated column
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      event_tags: {
        Row: {
          event_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          event_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          onboarding_complete: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
