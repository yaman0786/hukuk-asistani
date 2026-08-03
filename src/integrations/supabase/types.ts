export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_strikes: {
        Row: {
          blocked_until: string | null
          created_at: string
          last_strike_at: string
          strike_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          last_strike_at?: string
          strike_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          last_strike_at?: string
          strike_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      case_files: {
        Row: {
          bot_active: boolean
          court: string | null
          created_at: string
          extracted_text: string | null
          id: string
          last_analyzed_at: string | null
          mime: string | null
          size_bytes: number | null
          storage_path: string
          title: string
          updated_at: string
          user_id: string
          uyap_no: string | null
        }
        Insert: {
          bot_active?: boolean
          court?: string | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          last_analyzed_at?: string | null
          mime?: string | null
          size_bytes?: number | null
          storage_path: string
          title: string
          updated_at?: string
          user_id: string
          uyap_no?: string | null
        }
        Update: {
          bot_active?: boolean
          court?: string | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          last_analyzed_at?: string | null
          mime?: string | null
          size_bytes?: number | null
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
          uyap_no?: string | null
        }
        Relationships: []
      }
      case_reports: {
        Row: {
          case_file_id: string | null
          created_at: string
          id: string
          matches: Json
          model: string | null
          summary: string
          user_id: string
        }
        Insert: {
          case_file_id?: string | null
          created_at?: string
          id?: string
          matches?: Json
          model?: string | null
          summary: string
          user_id: string
        }
        Update: {
          case_file_id?: string | null
          created_at?: string
          id?: string
          matches?: Json
          model?: string | null
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_reports_case_file_id_fkey"
            columns: ["case_file_id"]
            isOneToOne: false
            referencedRelation: "case_files"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_updates: {
        Row: {
          created_at: string
          id: string
          importance: number
          kind: string
          published_at: string
          ref: string | null
          source: string | null
          summary: string
          tags: string[]
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          importance?: number
          kind: string
          published_at?: string
          ref?: string | null
          source?: string | null
          summary: string
          tags?: string[]
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          importance?: number
          kind?: string
          published_at?: string
          ref?: string | null
          source?: string | null
          summary?: string
          tags?: string[]
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      disclaimer_acceptance: {
        Row: {
          accepted_at: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          blocked: boolean
          quota_warning: boolean
          subscription_events: boolean
          updated_at: string
          user_id: string
          welcome: boolean
        }
        Insert: {
          blocked?: boolean
          quota_warning?: boolean
          subscription_events?: boolean
          updated_at?: string
          user_id: string
          welcome?: boolean
        }
        Update: {
          blocked?: boolean
          quota_warning?: boolean
          subscription_events?: boolean
          updated_at?: string
          user_id?: string
          welcome?: boolean
        }
        Relationships: []
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      hearing_participants: {
        Row: {
          display_name: string
          hearing_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          display_name?: string
          hearing_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          display_name?: string
          hearing_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hearing_participants_hearing_id_fkey"
            columns: ["hearing_id"]
            isOneToOne: false
            referencedRelation: "hearings"
            referencedColumns: ["id"]
          },
        ]
      }
      hearing_turns: {
        Row: {
          action: string | null
          author_id: string | null
          created_at: string
          hearing_id: string
          id: string
          role: string
          speaker: string
          text: string
        }
        Insert: {
          action?: string | null
          author_id?: string | null
          created_at?: string
          hearing_id: string
          id?: string
          role?: string
          speaker?: string
          text: string
        }
        Update: {
          action?: string | null
          author_id?: string | null
          created_at?: string
          hearing_id?: string
          id?: string
          role?: string
          speaker?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "hearing_turns_hearing_id_fkey"
            columns: ["hearing_id"]
            isOneToOne: false
            referencedRelation: "hearings"
            referencedColumns: ["id"]
          },
        ]
      }
      hearings: {
        Row: {
          case_type: string
          code: string
          court: string
          created_at: string
          id: string
          owner_id: string
          setup: Json
          status: string
          title: string
          updated_at: string
          verdict: string | null
        }
        Insert: {
          case_type?: string
          code: string
          court?: string
          created_at?: string
          id?: string
          owner_id: string
          setup?: Json
          status?: string
          title?: string
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          case_type?: string
          code?: string
          court?: string
          created_at?: string
          id?: string
          owner_id?: string
          setup?: Json
          status?: string
          title?: string
          updated_at?: string
          verdict?: string | null
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          article_no: string | null
          code: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          kind: string
          metadata: Json
          ref: string | null
          title: string
          updated_at: string
        }
        Insert: {
          article_no?: string | null
          code: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          kind: string
          metadata?: Json
          ref?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          article_no?: string | null
          code?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          kind?: string
          metadata?: Json
          ref?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_feedback: {
        Row: {
          created_at: string
          id: string
          message_id: string
          rating: number
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          rating: number
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          rating?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          description: string
          id: string
          kind: string
          prompt_template: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
          variables: Json
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          kind: string
          prompt_template: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          kind?: string
          prompt_template?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      thread_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          owner_id: string
          revoked: boolean
          thread_id: string
          token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id: string
          revoked?: boolean
          thread_id: string
          token: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          revoked?: boolean
          thread_id?: string
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "thread_shares_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          archived: boolean
          created_at: string
          folder_id: string | null
          id: string
          pinned: boolean
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          folder_id?: string | null
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          folder_id?: string | null
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tier: {
        Args: { _env?: string; _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hearing_participant: {
        Args: { _hearing_id: string; _user_id: string }
        Returns: boolean
      }
      match_legal_documents: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          article_no: string
          code: string
          content: string
          id: string
          kind: string
          ref: string
          similarity: number
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
