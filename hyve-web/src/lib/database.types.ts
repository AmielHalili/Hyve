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
          attend_token: string | null;
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
          attend_token?: string | null;
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
          attend_token?: string | null;
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
      event_attendance: {
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
      user_connections: {
        Row: {
          user_id: string;
          peer_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          peer_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          peer_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      connection_requests: {
        Row: {
          requester_id: string;
          recipient_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          requester_id: string;
          recipient_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          requester_id?: string;
          recipient_id?: string;
          status?: string;
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
          xp: number;
          role_type: string | null; // 'student' | 'workforce'
          student_major: string | null;
          job_category: string | null;
          twitter_url: string | null;
          instagram_url: string | null;
          linkedin_url: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          xp?: number;
          role_type?: string | null;
          student_major?: string | null;
          job_category?: string | null;
          twitter_url?: string | null;
          instagram_url?: string | null;
          linkedin_url?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
           xp?: number;
           role_type?: string | null;
           student_major?: string | null;
           job_category?: string | null;
           twitter_url?: string | null;
           instagram_url?: string | null;
           linkedin_url?: string | null;
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
