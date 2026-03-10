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
      asistencias_grupo_oracion: {
        Row: {
          asistio: boolean | null
          created_at: string | null
          grupo_id: string
          id: string
          misionero_id: string
        }
        Insert: {
          asistio?: boolean | null
          created_at?: string | null
          grupo_id: string
          id?: string
          misionero_id: string
        }
        Update: {
          asistio?: boolean | null
          created_at?: string | null
          grupo_id?: string
          id?: string
          misionero_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_grupo_oracion_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_oracion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_grupo_oracion_misionero_id_fkey"
            columns: ["misionero_id"]
            isOneToOne: false
            referencedRelation: "misioneros"
            referencedColumns: ["id"]
          }
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
          fecha_consagracion: string | null
          fecha_inicio: string
          finalizada: boolean
          id: string
        }
        Insert: {
          anio: number
          created_at?: string | null
          fecha_consagracion?: string | null
          fecha_inicio: string
          finalizada?: boolean
          id?: string
        }
        Update: {
          anio?: number
          created_at?: string | null
          fecha_consagracion?: string | null
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
      grupos_oracion: {
        Row: {
          activa: boolean
          created_at: string | null
          fecha: string
          id: string
          predica_mayor_misionero_id: string | null
          predica_menor_misionero_id: string | null
          predica_menor_santo: string | null
        }
        Insert: {
          activa?: boolean
          created_at?: string | null
          fecha: string
          id?: string
          predica_mayor_misionero_id?: string | null
          predica_menor_misionero_id?: string | null
          predica_menor_santo?: string | null
        }
        Update: {
          activa?: boolean
          created_at?: string | null
          fecha?: string
          id?: string
          predica_mayor_misionero_id?: string | null
          predica_menor_misionero_id?: string | null
          predica_menor_santo?: string | null
        }
        Relationships: []
      }
      inscripciones_consagracion: {
        Row: {
          apellido: string
          comentario: string | null
          created_at: string | null
          domicilio: string | null
          dni: string
          estado_civil: Database["public"]["Enums"]["estado_civil_enum"]
          formacion_id: string
          id: string
          nombre: string
          sacramentos: Json
          se_consagro: boolean | null
          tipo_inscripcion: string | null
          whatsapp: string
        }
        Insert: {
          apellido: string
          comentario?: string | null
          created_at?: string | null
          domicilio?: string | null
          dni: string
          estado_civil: Database["public"]["Enums"]["estado_civil_enum"]
          formacion_id: string
          id?: string
          nombre: string
          sacramentos?: Json
          se_consagro?: boolean | null
          tipo_inscripcion?: string | null
          whatsapp: string
        }
        Update: {
          apellido?: string
          comentario?: string | null
          created_at?: string | null
          domicilio?: string | null
          dni?: string
          estado_civil?: Database["public"]["Enums"]["estado_civil_enum"]
          formacion_id?: string
          id?: string
          nombre?: string
          sacramentos?: Json
          se_consagro?: boolean | null
          tipo_inscripcion?: string | null
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
          activo: boolean | null
          apellido: string
          created_at: string | null
          domicilio: string | null
          dni: string
          fecha_consagracion: string | null
          fecha_nacimiento: string | null
          fecha_retiro_conversion: string | null
          id: string
          nombre: string
          whatsapp: string
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          created_at?: string | null
          domicilio?: string | null
          dni: string
          fecha_consagracion?: string | null
          fecha_nacimiento?: string | null
          fecha_retiro_conversion?: string | null
          id?: string
          nombre: string
          whatsapp: string
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          created_at?: string | null
          domicilio?: string | null
          dni?: string
          fecha_consagracion?: string | null
          fecha_nacimiento?: string | null
          fecha_retiro_conversion?: string | null
          id?: string
          nombre?: string
          whatsapp?: string
        }
        Relationships: []
      }
      roles_misionero: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      misioneros_roles: {
        Row: {
          created_at: string | null
          misionero_id: string
          rol_id: string
        }
        Insert: {
          created_at?: string | null
          misionero_id: string
          rol_id: string
        }
        Update: {
          created_at?: string | null
          misionero_id?: string
          rol_id?: string
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
      retiros: {
        Row: {
          activo: boolean | null
          costo: number | null
          created_at: string | null
          cupo: number | null
          descripcion: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          imagen_url: string | null
          lugar: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_retiro"]
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          costo?: number | null
          created_at?: string | null
          cupo?: number | null
          descripcion?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          imagen_url?: string | null
          lugar: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_retiro"]
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          costo?: number | null
          created_at?: string | null
          cupo?: number | null
          descripcion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          imagen_url?: string | null
          lugar?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_retiro"]
          updated_at?: string | null
        }
        Relationships: []
      }
      inscripciones_retiro_conversion: {
        Row: {
          apellido: string
          bautizado: boolean
          contactos_emergencia: Json | null
          created_at: string | null
          dni: string
          domicilio: string | null
          dieta_especial_detalle: string | null
          enfermedad_detalle: string | null
          en_espera: boolean
          estado_civil: string | null
          fecha_nacimiento: string | null
          id: string
          nombre: string
          primer_retiro: boolean
          retiro_id: string
          tiene_dieta_especial: boolean
          tiene_enfermedad: boolean
          telefono: string
        }
        Insert: {
          apellido: string
          bautizado?: boolean
          contactos_emergencia?: Json | null
          created_at?: string | null
          dni: string
          domicilio?: string | null
          dieta_especial_detalle?: string | null
          enfermedad_detalle?: string | null
          en_espera?: boolean
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre: string
          primer_retiro?: boolean
          retiro_id: string
          tiene_dieta_especial?: boolean
          tiene_enfermedad?: boolean
          telefono: string
        }
        Update: {
          apellido?: string
          bautizado?: boolean
          contactos_emergencia?: Json | null
          created_at?: string | null
          dni?: string
          domicilio?: string | null
          dieta_especial_detalle?: string | null
          enfermedad_detalle?: string | null
          en_espera?: boolean
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          primer_retiro?: boolean
          retiro_id?: string
          tiene_dieta_especial?: boolean
          tiene_enfermedad?: boolean
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_retiro_conversion_retiro_id_fkey"
            columns: ["retiro_id"]
            isOneToOne: false
            referencedRelation: "retiros"
            referencedColumns: ["id"]
          }
        ]
      }
      inscripciones_retiro_matrimonios: {
        Row: {
          apellido_esposa: string
          apellido_esposo: string
          como_se_enteraron: string | null
          created_at: string | null
          domicilio: string | null
          dni_esposa: string
          dni_esposo: string
          entrevista_fecha: string | null
          entrevista_notas: string | null
          entrevista_realizada: boolean
          estado_relacion: Database["public"]["Enums"]["estado_relacion"]
          fecha_nacimiento_esposa: string | null
          fecha_nacimiento_esposo: string | null
          id: string
          nombre_esposa: string
          nombre_esposo: string
          retiro_id: string
          whatsapp_esposa: string
          whatsapp_esposo: string
          en_espera: boolean
        }
        Insert: {
          apellido_esposa: string
          apellido_esposo: string
          como_se_enteraron?: string | null
          created_at?: string | null
          domicilio?: string | null
          dni_esposa: string
          dni_esposo: string
          entrevista_fecha?: string | null
          entrevista_notas?: string | null
          entrevista_realizada?: boolean
          estado_relacion: Database["public"]["Enums"]["estado_relacion"]
          fecha_nacimiento_esposa?: string | null
          fecha_nacimiento_esposo?: string | null
          id?: string
          nombre_esposa: string
          nombre_esposo: string
          retiro_id: string
          whatsapp_esposa: string
          whatsapp_esposo: string
          en_espera?: boolean
        }
        Update: {
          apellido_esposa?: string
          apellido_esposo?: string
          como_se_enteraron?: string | null
          created_at?: string | null
          domicilio?: string | null
          dni_esposa?: string
          dni_esposo?: string
          entrevista_fecha?: string | null
          entrevista_notas?: string | null
          entrevista_realizada?: boolean
          estado_relacion?: Database["public"]["Enums"]["estado_relacion"]
          fecha_nacimiento_esposa?: string | null
          fecha_nacimiento_esposo?: string | null
          id?: string
          nombre_esposa?: string
          nombre_esposo?: string
          retiro_id?: string
          whatsapp_esposa?: string
          whatsapp_esposo?: string
          en_espera?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_retiro_matrimonios_retiro_id_fkey"
            columns: ["retiro_id"]
            isOneToOne: false
            referencedRelation: "retiros"
            referencedColumns: ["id"]
          }
        ]
      }
      inscripciones_retiro_misioneros: {
        Row: {
          created_at: string | null
          id: string
          misionero_id: string
          retiro_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          misionero_id: string
          retiro_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          misionero_id?: string
          retiro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_retiro_misioneros_misionero_id_fkey"
            columns: ["misionero_id"]
            isOneToOne: false
            referencedRelation: "misioneros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_retiro_misioneros_retiro_id_fkey"
            columns: ["retiro_id"]
            isOneToOne: false
            referencedRelation: "retiros"
            referencedColumns: ["id"]
          }
        ]
      }
      roles_servidor_retiro: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      servidores_retiro: {
        Row: {
          created_at: string | null
          id: string
          misionero_id: string
          notas: string | null
          retiro_id: string
          rol_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          misionero_id: string
          notas?: string | null
          retiro_id: string
          rol_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          misionero_id?: string
          notas?: string | null
          retiro_id?: string
          rol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servidores_retiro_misionero_id_fkey"
            columns: ["misionero_id"]
            isOneToOne: false
            referencedRelation: "misioneros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidores_retiro_retiro_id_fkey"
            columns: ["retiro_id"]
            isOneToOne: false
            referencedRelation: "retiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servidores_retiro_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles_servidor_retiro"
            referencedColumns: ["id"]
          }
        ]
      }
      pagos_retiro: {
        Row: {
          created_at: string | null
          fecha: string
          id: string
          inscripcion_id: string
          metodo: Database["public"]["Enums"]["metodo_pago"]
          monto: number
          notas: string | null
          retiro_id: string
          tipo_inscripcion: Database["public"]["Enums"]["tipo_retiro"]
        }
        Insert: {
          created_at?: string | null
          fecha: string
          id?: string
          inscripcion_id: string
          metodo: Database["public"]["Enums"]["metodo_pago"]
          monto: number
          notas?: string | null
          retiro_id: string
          tipo_inscripcion: Database["public"]["Enums"]["tipo_retiro"]
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id?: string
          inscripcion_id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"]
          monto?: number
          notas?: string | null
          retiro_id?: string
          tipo_inscripcion?: Database["public"]["Enums"]["tipo_retiro"]
        }
        Relationships: [
          {
            foreignKeyName: "pagos_retiro_retiro_id_fkey"
            columns: ["retiro_id"]
            isOneToOne: false
            referencedRelation: "retiros"
            referencedColumns: ["id"]
          }
        ]
      }
      compras_retiro: {
        Row: {
          cantidad: number | null
          concepto: string
          comprado: boolean
          created_at: string | null
          costo: number | null
          id: string
          retiro_id: string
          unidad: string | null
        }
        Insert: {
          cantidad?: number | null
          concepto: string
          comprado?: boolean
          created_at?: string | null
          costo?: number | null
          id?: string
          retiro_id: string
          unidad?: string | null
        }
        Update: {
          cantidad?: number | null
          concepto?: string
          comprado?: boolean
          created_at?: string | null
          costo?: number | null
          id?: string
          retiro_id?: string
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_retiro_retiro_id_fkey"
            columns: ["retiro_id"]
            isOneToOne: false
            referencedRelation: "retiros"
            referencedColumns: ["id"]
          }
        ]
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
      estado_relacion: "union_libre" | "casados" | "comprometidos" | "novios"
      metodo_pago: "efectivo" | "transferencia" | "tarjeta"
      tipo_formacion: "san_lorenzo" | "escuela_de_maria"
      tipo_leccion: "leccion" | "retiro"
      tipo_retiro: "conversion" | "matrimonios" | "misioneros"
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
      estado_relacion: ["union_libre", "casados", "comprometidos", "novios"],
      metodo_pago: ["efectivo", "transferencia", "tarjeta"],
      tipo_formacion: ["san_lorenzo", "escuela_de_maria"],
      tipo_leccion: ["leccion", "retiro"],
      tipo_retiro: ["conversion", "matrimonios", "misioneros"],
      user_role: ["admin", "secretario_consagracion"],
    },
  },
} as const
