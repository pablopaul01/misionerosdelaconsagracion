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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      asistencias_consagracion: {
        Row: {
          asistio: boolean
          created_at: string | null
          id: string
          inscripcion_id: string
          leccion_id: string
        }
        Insert: {
          asistio: boolean
          created_at?: string | null
          id?: string
          inscripcion_id: string
          leccion_id: string
        }
        Update: {
          asistio?: boolean
          created_at?: string | null
          id?: string
          inscripcion_id?: string
          leccion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_consagracion_inscripcion_id_fkey"
            columns: ["inscripcion_id"]
            isOneToOne: false
            referencedRelation: "inscripciones_consagracion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_consagracion_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "lecciones_consagracion"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencias_misioneros: {
        Row: {
          asistio: boolean
          clase_id: string
          created_at: string | null
          id: string
          misionero_id: string
          motivo_ausencia: string | null
        }
        Insert: {
          asistio: boolean
          clase_id: string
          created_at?: string | null
          id?: string
          misionero_id: string
          motivo_ausencia?: string | null
        }
        Update: {
          asistio?: boolean
          clase_id?: string
          created_at?: string | null
          id?: string
          misionero_id?: string
          motivo_ausencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_misioneros_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_misioneros_misionero_id_fkey"
            columns: ["misionero_id"]
            isOneToOne: false
            referencedRelation: "misioneros"
            referencedColumns: ["id"]
          },
        ]
      }
      clases: {
        Row: {
          activa: boolean
          created_at: string | null
          fecha: string
          formacion_id: string
          id: string
          numero: number
        }
        Insert: {
          activa?: boolean
          created_at?: string | null
          fecha: string
          formacion_id: string
          id?: string
          numero: number
        }
        Update: {
          activa?: boolean
          created_at?: string | null
          fecha?: string
          formacion_id?: string
          id?: string
          numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "clases_formacion_id_fkey"
            columns: ["formacion_id"]
            isOneToOne: false
            referencedRelation: "formaciones_misioneros"
            referencedColumns: ["id"]
          },
        ]
      }
      formaciones_consagracion: {
        Row: {
          anio: number
          created_at: string | null
          fecha_inicio: string
          finalizada: boolean
          id: string
        }
        Insert: {
          anio: number
          created_at?: string | null
          fecha_inicio: string
          finalizada?: boolean
          id?: string
        }
        Update: {
          anio?: number
          created_at?: string | null
          fecha_inicio?: string
          finalizada?: boolean
          id?: string
        }
        Relationships: []
      }
      formaciones_misioneros: {
        Row: {
          anio: number
          created_at: string | null
          dia_semana: number
          fecha_inicio: string
          finalizada: boolean
          id: string
          tipo: Database["public"]["Enums"]["tipo_formacion"]
        }
        Insert: {
          anio: number
          created_at?: string | null
          dia_semana: number
          fecha_inicio: string
          finalizada?: boolean
          id?: string
          tipo: Database["public"]["Enums"]["tipo_formacion"]
        }
        Update: {
          anio?: number
          created_at?: string | null
          dia_semana?: number
          fecha_inicio?: string
          finalizada?: boolean
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_formacion"]
        }
        Relationships: []
      }
      inscripciones_consagracion: {
        Row: {
          apellido: string
          comentario: string | null
          created_at: string | null
          domicilio: string | null
          estado_civil: Database["public"]["Enums"]["estado_civil_enum"]
          formacion_id: string
          id: string
          nombre: string
          sacramentos: Json
          se_consagro: boolean | null
          whatsapp: string
        }
        Insert: {
          apellido: string
          comentario?: string | null
          created_at?: string | null
          domicilio?: string | null
          estado_civil: Database["public"]["Enums"]["estado_civil_enum"]
          formacion_id: string
          id?: string
          nombre: string
          sacramentos?: Json
          se_consagro?: boolean | null
          whatsapp: string
        }
        Update: {
          apellido?: string
          comentario?: string | null
          created_at?: string | null
          domicilio?: string | null
          estado_civil?: Database["public"]["Enums"]["estado_civil_enum"]
          formacion_id?: string
          id?: string
          nombre?: string
          sacramentos?: Json
          se_consagro?: boolean | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_consagracion_formacion_id_fkey"
            columns: ["formacion_id"]
            isOneToOne: false
            referencedRelation: "formaciones_consagracion"
            referencedColumns: ["id"]
          },
        ]
      }
      inscripciones_misioneros: {
        Row: {
          completo: boolean | null
          created_at: string | null
          formacion_id: string
          id: string
          misionero_id: string
        }
        Insert: {
          completo?: boolean | null
          created_at?: string | null
          formacion_id: string
          id?: string
          misionero_id: string
        }
        Update: {
          completo?: boolean | null
          created_at?: string | null
          formacion_id?: string
          id?: string
          misionero_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_misioneros_formacion_id_fkey"
            columns: ["formacion_id"]
            isOneToOne: false
            referencedRelation: "formaciones_misioneros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_misioneros_misionero_id_fkey"
            columns: ["misionero_id"]
            isOneToOne: false
            referencedRelation: "misioneros"
            referencedColumns: ["id"]
          },
        ]
      }
      lecciones_consagracion: {
        Row: {
          created_at: string | null
          disertante_id: string | null
          fecha: string | null
          formacion_id: string
          id: string
          numero: number
          tipo: Database["public"]["Enums"]["tipo_leccion"]
        }
        Insert: {
          created_at?: string | null
          disertante_id?: string | null
          fecha?: string | null
          formacion_id: string
          id?: string
          numero: number
          tipo: Database["public"]["Enums"]["tipo_leccion"]
        }
        Update: {
          created_at?: string | null
          disertante_id?: string | null
          fecha?: string | null
          formacion_id?: string
          id?: string
          numero?: number
          tipo?: Database["public"]["Enums"]["tipo_leccion"]
        }
        Relationships: [
          {
            foreignKeyName: "lecciones_consagracion_disertante_id_fkey"
            columns: ["disertante_id"]
            isOneToOne: false
            referencedRelation: "misioneros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_consagracion_formacion_id_fkey"
            columns: ["formacion_id"]
            isOneToOne: false
            referencedRelation: "formaciones_consagracion"
            referencedColumns: ["id"]
          },
        ]
      }
      misioneros: {
        Row: {
          apellido: string
          created_at: string | null
          dni: string
          id: string
          nombre: string
          whatsapp: string
        }
        Insert: {
          apellido: string
          created_at?: string | null
          dni: string
          id?: string
          nombre: string
          whatsapp: string
        }
        Update: {
          apellido?: string
          created_at?: string | null
          dni?: string
          id?: string
          nombre?: string
          whatsapp?: string
        }
        Relationships: []
      }
      papas_consagracion: {
        Row: {
          created_at: string | null
          formacion_id: string
          id: string
          misionero_id: string
        }
        Insert: {
          created_at?: string | null
          formacion_id: string
          id?: string
          misionero_id: string
        }
        Update: {
          created_at?: string | null
          formacion_id?: string
          id?: string
          misionero_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "papas_consagracion_formacion_id_fkey"
            columns: ["formacion_id"]
            isOneToOne: false
            referencedRelation: "formaciones_consagracion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "papas_consagracion_misionero_id_fkey"
            columns: ["misionero_id"]
            isOneToOne: false
            referencedRelation: "misioneros"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          id: string
          nombre: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_clase: {
        Args: { p_clase_id: string; p_formacion_id: string }
        Returns: undefined
      }
    }
    Enums: {
      estado_civil_enum: "soltero_a" | "casado" | "divorciado" | "viudo"
      tipo_formacion: "san_lorenzo" | "escuela_de_maria"
      tipo_leccion: "leccion" | "retiro"
      user_role: "admin" | "secretario_consagracion"
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
      estado_civil_enum: ["soltero_a", "casado", "divorciado", "viudo"],
      tipo_formacion: ["san_lorenzo", "escuela_de_maria"],
      tipo_leccion: ["leccion", "retiro"],
      user_role: ["admin", "secretario_consagracion"],
    },
  },
} as const
