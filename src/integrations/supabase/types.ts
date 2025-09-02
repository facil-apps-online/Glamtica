export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_evidence: {
        Row: {
          appointment_id: string
          created_at: string
          extra_service_session_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          session_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          extra_service_session_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          session_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          extra_service_session_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          session_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_evidence_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_evidence_extra_service_session_id_fkey"
            columns: ["extra_service_session_id"]
            isOneToOne: false
            referencedRelation: "extra_service_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_evidence_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "appointment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_extra_services: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          notes: string | null
          price: number
          service_id: string
          stylist_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          price: number
          service_id: string
          stylist_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          price?: number
          service_id?: string
          stylist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_extra_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_extra_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_extra_services_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_products: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_products_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_sessions: {
        Row: {
          appointment_id: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string | null
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          attention_datetime: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          service_id: string
          status: string | null
          stylist_id: string
          total_price: number
          updated_at: string
        }
        Insert: {
          attention_datetime: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id: string
          status?: string | null
          stylist_id: string
          total_price: number
          updated_at?: string
        }
        Update: {
          attention_datetime?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          status?: string | null
          stylist_id?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      attention_products: {
        Row: {
          attention_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          attention_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          attention_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_products_attention_id_fkey"
            columns: ["attention_id"]
            isOneToOne: false
            referencedRelation: "attentions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      attention_service_products: {
        Row: {
          attention_id: string
          attention_service_id: string
          commission_rate: number
          created_at: string
          id: string
          product_id: string
          quantity: number
          stylist_id: string
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          attention_id: string
          attention_service_id: string
          commission_rate?: number
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          stylist_id: string
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          attention_id?: string
          attention_service_id?: string
          commission_rate?: number
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          stylist_id?: string
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_service_products_attention_id_fkey"
            columns: ["attention_id"]
            isOneToOne: false
            referencedRelation: "attentions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_service_products_attention_service_id_fkey"
            columns: ["attention_service_id"]
            isOneToOne: false
            referencedRelation: "attention_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_service_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_service_products_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      attention_services: {
        Row: {
          attention_id: string
          created_at: string
          id: string
          notes: string | null
          service_id: string
          service_order: number
          service_price: number
          status: string
          stylist_id: string
          updated_at: string
        }
        Insert: {
          attention_id: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id: string
          service_order?: number
          service_price: number
          status?: string
          stylist_id: string
          updated_at?: string
        }
        Update: {
          attention_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          service_order?: number
          service_price?: number
          status?: string
          stylist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_services_attention_id_fkey"
            columns: ["attention_id"]
            isOneToOne: false
            referencedRelation: "attentions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_services_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      attentions: {
        Row: {
          attention_datetime: string | null
          client_id: string
          created_at: string
          id: string
          notes: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          attention_datetime: string | null
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          attention_datetime?: string | null
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attentions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      extra_service_sessions: {
        Row: {
          appointment_id: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          extra_service_id: string
          id: string
          notes: string | null
          started_at: string | null
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          extra_service_id: string
          id?: string
          notes?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          extra_service_id?: string
          id?: string
          notes?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_service_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_service_sessions_extra_service_id_fkey"
            columns: ["extra_service_id"]
            isOneToOne: false
            referencedRelation: "appointment_extra_services"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          native_name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          native_name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          native_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_stylist_commissions: {
        Row: {
          commission_rate: number
          created_at: string | null
          id: string
          product_id: string
          stylist_id: string
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string | null
          id?: string
          product_id: string
          stylist_id: string
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          id?: string
          product_id?: string
          stylist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_stylist_commissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stylist_commissions_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          average_cost: number | null
          barcode: string | null
          brand_id: string | null
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          last_purchase_cost: number | null
          max_stock: number | null
          min_stock: number | null
          name: string
          price: number
          sku: string | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          average_cost?: number | null
          barcode?: string | null
          brand_id?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_cost?: number | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          price: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          average_cost?: number | null
          barcode?: string | null
          brand_id?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_cost?: number | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          purchase_id: string
          quantity: number
          total_cost: number
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          purchase_id: string
          quantity?: number
          total_cost: number
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          purchase_id?: string
          quantity?: number
          total_cost?: number
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          purchase_date: string
          status: string | null
          supplier_id: string | null
          supplier_name: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          purchase_date?: string
          status?: string | null
          supplier_id?: string | null
          supplier_name: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          purchase_date?: string
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_evidence: {
        Row: {
          attention_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          service_session_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          attention_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          service_session_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          attention_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          service_session_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_evidence_attention_id_fkey"
            columns: ["attention_id"]
            isOneToOne: false
            referencedRelation: "attentions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_evidence_service_session_id_fkey"
            columns: ["service_session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      service_sessions: {
        Row: {
          attention_service_id: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string | null
          updated_at: string
        }
        Insert: {
          attention_service_id: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          attention_service_id?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_sessions_attention_service_id_fkey"
            columns: ["attention_service_id"]
            isOneToOne: false
            referencedRelation: "attention_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_stylist_commissions: {
        Row: {
          can_perform: boolean | null
          commission_rate: number
          created_at: string | null
          id: string
          service_id: string
          stylist_id: string
          updated_at: string | null
        }
        Insert: {
          can_perform?: boolean | null
          commission_rate?: number
          created_at?: string | null
          id?: string
          service_id: string
          stylist_id: string
          updated_at?: string | null
        }
        Update: {
          can_perform?: boolean | null
          commission_rate?: number
          created_at?: string | null
          id?: string
          service_id?: string
          stylist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_stylist_commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_stylist_commissions_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      stylist_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          stylist_id: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          stylist_id: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          stylist_id?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_schedules_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_time_off: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          end_date: string
          end_time: string | null
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          start_time: string | null
          status: string
          stylist_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          stylist_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          stylist_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_time_off_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylists: {
        Row: {
          commission_rate: number | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          specialties: string[] | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_products: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          product_id: string
          supplier_id: string
          supplier_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id: string
          supplier_id: string
          supplier_price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          supplier_id?: string
          supplier_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          identification_number: string
          identification_type: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          identification_number: string
          identification_type: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          identification_number?: string
          identification_type?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          context: string | null
          created_at: string
          id: string
          key: string
          language_id: string
          updated_at: string
          value: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          key: string
          language_id: string
          updated_at?: string
          value: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          key?: string
          language_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_stylist_availability: {
        Args: {
          p_stylist_id: string
          p_attention_datetime: string
          p_duration_minutes?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
