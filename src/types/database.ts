export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string;
          nickname: string;
          home_location: string;
          default_currency: string;
          default_timezone: string;
          default_map_provider: string;
          show_expenses: boolean;
          show_purchases: boolean;
          show_journals: boolean;
          show_media_notes: boolean;
          record_preferences_configured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          nickname?: string;
          home_location?: string;
          default_currency?: string;
          default_timezone?: string;
          default_map_provider?: string;
          show_expenses?: boolean;
          show_purchases?: boolean;
          show_journals?: boolean;
          show_media_notes?: boolean;
          record_preferences_configured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          home_location?: string;
          default_currency?: string;
          default_timezone?: string;
          default_map_provider?: string;
          show_expenses?: boolean;
          show_purchases?: boolean;
          show_journals?: boolean;
          show_media_notes?: boolean;
          record_preferences_configured?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          destination: string;
          departure_location: string;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
          budget_amount: number | null;
          budget_currency: string | null;
          timezone: string;
          travel_note: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          destination: string;
          departure_location: string;
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
          budget_amount?: number | null;
          budget_currency?: string | null;
          timezone?: string;
          travel_note?: string | null;
        };
        Update: {
          name?: string;
          destination?: string;
          departure_location?: string;
          start_date?: string;
          end_date?: string;
          updated_at?: string;
          budget_amount?: number | null;
          budget_currency?: string | null;
          timezone?: string;
          travel_note?: string | null;
        };
        Relationships: [];
      };
      trip_days: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          day_number: number;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          day_number: number;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          day_number?: number;
          date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      preparation_items: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          title: string;
          category: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          title: string;
          category: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          category?: string;
          completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          trip_day_id: string;
          user_id: string;
          time: string | null;
          place_name: string;
          address: string;
          duration_minutes: number;
          notes: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          trip_day_id: string;
          user_id: string;
          time?: string | null;
          place_name: string;
          address?: string;
          duration_minutes: number;
          notes?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          trip_day_id?: string;
          time?: string | null;
          place_name?: string;
          address?: string;
          duration_minutes?: number;
          notes?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: { id: string; trip_id: string; user_id: string; date: string; title: string; amount: number; currency: string; category: string; notes: string; created_at: string; updated_at: string };
        Insert: { id?: string; trip_id: string; user_id: string; date: string; title: string; amount: number; currency: string; category: string; notes?: string; created_at?: string; updated_at?: string };
        Update: { date?: string; title?: string; amount?: number; currency?: string; category?: string; notes?: string; updated_at?: string };
        Relationships: [];
      };
      purchases: {
        Row: { id: string; trip_id: string; user_id: string; date: string; title: string; amount: number; currency: string; location: string; recipient: string; notes: string; organized: boolean; purchased: boolean; include_in_expenses: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; trip_id: string; user_id: string; date: string; title: string; amount: number; currency: string; location?: string; recipient?: string; notes?: string; organized?: boolean; purchased?: boolean; include_in_expenses?: boolean; created_at?: string; updated_at?: string };
        Update: { date?: string; title?: string; amount?: number; currency?: string; location?: string; recipient?: string; notes?: string; organized?: boolean; purchased?: boolean; include_in_expenses?: boolean; updated_at?: string };
        Relationships: [];
      };
      media_notes: {
        Row: { id: string; trip_id: string; user_id: string; trip_day_id: string | null; itinerary_item_id: string | null; media_type: string; filename: string; notes: string; favorite: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; trip_id: string; user_id: string; trip_day_id?: string | null; itinerary_item_id?: string | null; media_type: string; filename: string; notes?: string; favorite?: boolean; created_at?: string; updated_at?: string };
        Update: { trip_day_id?: string | null; itinerary_item_id?: string | null; media_type?: string; filename?: string; notes?: string; favorite?: boolean; updated_at?: string };
        Relationships: [];
      };
      journals: {
        Row: { id: string; trip_id: string; user_id: string; trip_day_id: string; content: string; rating: number | null; created_at: string; updated_at: string };
        Insert: { id?: string; trip_id: string; user_id: string; trip_day_id: string; content: string; rating?: number | null; created_at?: string; updated_at?: string };
        Update: { content?: string; rating?: number | null; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_trip_with_days: {
        Args: {
          p_name: string;
          p_destination: string;
          p_departure_location: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: string;
      };
      create_trip_with_days_v2: {
        Args: { p_name: string; p_destination: string; p_departure_location: string; p_start_date: string; p_end_date: string; p_timezone: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
