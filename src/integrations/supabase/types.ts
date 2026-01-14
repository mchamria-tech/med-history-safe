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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          phone: string | null
          support_email: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          support_email?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          support_email?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      doctor_access: {
        Row: {
          created_at: string | null
          doctor_id: string
          expires_at: string
          granted_by_user_id: string | null
          id: string
          is_revoked: boolean | null
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          expires_at: string
          granted_by_user_id?: string | null
          id?: string
          is_revoked?: boolean | null
          profile_id: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          expires_at?: string
          granted_by_user_id?: string | null
          id?: string
          is_revoked?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_access_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string | null
          email: string
          global_id: string
          hospital: string | null
          id: string
          is_active: boolean | null
          name: string
          partner_id: string | null
          phone: string | null
          specialty: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          global_id: string
          hospital?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          partner_id?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          global_id?: string
          hospital?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          partner_id?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_grants: {
        Row: {
          created_at: string | null
          document_id: string
          expires_at: string
          granted_by_user_id: string
          granted_to_id: string
          granted_to_type: Database["public"]["Enums"]["access_grant_type"]
          id: string
          is_revoked: boolean | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          expires_at: string
          granted_by_user_id: string
          granted_to_id: string
          granted_to_type: Database["public"]["Enums"]["access_grant_type"]
          id?: string
          is_revoked?: boolean | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          expires_at?: string
          granted_by_user_id?: string
          granted_to_id?: string
          granted_to_type?: Database["public"]["Enums"]["access_grant_type"]
          id?: string
          is_revoked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_grants_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ailment: string | null
          created_at: string
          doctor_id: string | null
          doctor_name: string | null
          document_date: string
          document_name: string
          document_type: string | null
          document_url: string
          id: string
          medicine: string | null
          other_tags: string | null
          partner_id: string | null
          partner_source_name: string | null
          profile_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          ailment?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string | null
          document_date: string
          document_name: string
          document_type?: string | null
          document_url: string
          id?: string
          medicine?: string | null
          other_tags?: string | null
          partner_id?: string | null
          partner_source_name?: string | null
          profile_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          ailment?: string | null
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string | null
          document_date?: string
          document_name?: string
          document_type?: string | null
          document_url?: string
          id?: string
          medicine?: string | null
          other_tags?: string | null
          partner_id?: string | null
          partner_source_name?: string | null
          profile_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          admin_responded_at: string | null
          admin_responder_id: string | null
          admin_response: string | null
          category: string
          created_at: string
          id: string
          message: string
          page_url: string | null
          rating: number | null
          status: string
          subject: string
          ticket_code: string | null
          updated_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          admin_responded_at?: string | null
          admin_responder_id?: string | null
          admin_response?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          page_url?: string | null
          rating?: number | null
          status?: string
          subject: string
          ticket_code?: string | null
          updated_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          admin_responded_at?: string | null
          admin_responder_id?: string | null
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          page_url?: string | null
          rating?: number | null
          status?: string
          subject?: string
          ticket_code?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_otp_requests: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          partner_id: string
          profile_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          partner_id: string
          profile_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          partner_id?: string
          profile_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_otp_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_otp_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_users: {
        Row: {
          consent_given: boolean | null
          consent_timestamp: string | null
          id: string
          linked_at: string | null
          partner_id: string
          profile_id: string
        }
        Insert: {
          consent_given?: boolean | null
          consent_timestamp?: string | null
          id?: string
          linked_at?: string | null
          partner_id: string
          profile_id: string
        }
        Update: {
          consent_given?: boolean | null
          consent_timestamp?: string | null
          id?: string
          linked_at?: string | null
          partner_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          govt_certification: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          partner_code: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          govt_certification?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          partner_code: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          govt_certification?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          partner_code?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allergies: string | null
          blood_glucose: string | null
          blood_pressure: string | null
          carebag_id: string | null
          created_at: string
          created_by_partner_id: string | null
          date_of_birth: string | null
          email: string | null
          expiry_date: string | null
          gender: string | null
          height: string | null
          id: string
          insurer: string | null
          name: string
          phone: string | null
          policy_no: string | null
          profile_photo_url: string | null
          relation: string | null
          rm_name: string | null
          rm_no: string | null
          type_of_plan: string | null
          updated_at: string
          user_id: string | null
          weight: string | null
        }
        Insert: {
          allergies?: string | null
          blood_glucose?: string | null
          blood_pressure?: string | null
          carebag_id?: string | null
          created_at?: string
          created_by_partner_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          expiry_date?: string | null
          gender?: string | null
          height?: string | null
          id?: string
          insurer?: string | null
          name: string
          phone?: string | null
          policy_no?: string | null
          profile_photo_url?: string | null
          relation?: string | null
          rm_name?: string | null
          rm_no?: string | null
          type_of_plan?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Update: {
          allergies?: string | null
          blood_glucose?: string | null
          blood_pressure?: string | null
          carebag_id?: string | null
          created_at?: string
          created_by_partner_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          expiry_date?: string | null
          gender?: string | null
          height?: string | null
          id?: string
          insurer?: string | null
          name?: string
          phone?: string | null
          policy_no?: string | null
          profile_photo_url?: string | null
          relation?: string | null
          rm_name?: string | null
          rm_no?: string | null
          type_of_plan?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_partner_id_fkey"
            columns: ["created_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      doctor_has_document_grant: {
        Args: { d_id: string; doc_id: string }
        Returns: boolean
      }
      doctor_is_attached: { Args: { d_id: string }; Returns: boolean }
      document_uploaded_by_doctor: {
        Args: { d_id: string; doc_id: string }
        Returns: boolean
      }
      document_uploaded_by_partner: {
        Args: { doc_id: string; p_id: string }
        Returns: boolean
      }
      generate_carebag_id: { Args: never; Returns: string }
      generate_global_id: { Args: { role_type?: string }; Returns: string }
      generate_partner_code: { Args: never; Returns: string }
      generate_ticket_code: { Args: never; Returns: string }
      get_doctor_id: { Args: { user_id: string }; Returns: string }
      get_doctor_partner_id: { Args: { d_id: string }; Returns: string }
      get_partner_id: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_doctor: { Args: { user_id: string }; Returns: boolean }
      is_partner: { Args: { user_id: string }; Returns: boolean }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
      partner_has_document_grant: {
        Args: { doc_id: string; p_id: string }
        Returns: boolean
      }
      user_owns_document: {
        Args: { doc_id: string; u_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_grant_type: "partner" | "doctor"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "partner"
        | "super_admin"
        | "doctor"
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
      access_grant_type: ["partner", "doctor"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "partner",
        "super_admin",
        "doctor",
      ],
    },
  },
} as const
