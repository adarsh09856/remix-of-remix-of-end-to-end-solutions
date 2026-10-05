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
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          line1: string
          line2: string | null
          phone: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          line1: string
          line2?: string | null
          phone: string
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          line2?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          order_id: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          order_id: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          max_discount: number | null
          min_order: number
          per_user_limit: number
          starts_at: string | null
          type: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_order?: number
          per_user_limit?: number
          starts_at?: string | null
          type: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_order?: number
          per_user_limit?: number
          starts_at?: string | null
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      crm_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          summary?: string | null
        }
        Relationships: []
      }
      crm_customer_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: []
      }
      crm_enquiries: {
        Row: {
          created_at: string
          email: string | null
          handled_by: string | null
          id: string
          message: string
          name: string
          phone: string | null
          reply: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          handled_by?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          reply?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          reply?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          name: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          source: string
          status: string
          updated_at: string
          value_inr: number
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          value_inr?: number
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          value_inr?: number
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          details: string | null
          due_date: string | null
          id: string
          priority: string
          related_id: string | null
          related_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          related_id?: string | null
          related_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          related_id?: string | null
          related_type?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          actor_id: string | null
          created_at: string
          delta: number
          id: string
          order_id: string | null
          product_id: string
          reason: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delta: number
          id?: string
          order_id?: string | null
          product_id: string
          reason: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          order_id?: string | null
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          line_total_inr: number
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          unit_price_inr: number
        }
        Insert: {
          id?: string
          line_total_inr: number
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          unit_price_inr: number
        }
        Update: {
          id?: string
          line_total_inr?: number
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          unit_price_inr?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_snapshot: Json | null
          admin_notes: string | null
          amount_tendered: number | null
          cancelled_at: string | null
          cancelled_reason: string | null
          cashier_id: string | null
          change_due: number | null
          channel: string
          counter_note: string | null
          country_code: string
          coupon_code: string | null
          courier: string | null
          created_at: string
          currency: string
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          estimated_delivery: string | null
          id: string
          invoice_number: string | null
          manual_discount: number
          payment_method: string
          paypal_capture_id: string | null
          paypal_order_id: string | null
          pos_session_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refunded_at: string | null
          ship_address_line1: string
          ship_address_line2: string | null
          ship_city: string
          ship_country: string
          ship_full_name: string
          ship_phone: string | null
          ship_postal_code: string | null
          ship_state: string | null
          shipping_inr: number
          shipping_method: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          subtotal_inr: number
          tax_amount: number
          total_inr: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_snapshot?: Json | null
          admin_notes?: string | null
          amount_tendered?: number | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          cashier_id?: string | null
          change_due?: number | null
          channel?: string
          counter_note?: string | null
          country_code?: string
          coupon_code?: string | null
          courier?: string | null
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          estimated_delivery?: string | null
          id?: string
          invoice_number?: string | null
          manual_discount?: number
          payment_method?: string
          paypal_capture_id?: string | null
          paypal_order_id?: string | null
          pos_session_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refunded_at?: string | null
          ship_address_line1: string
          ship_address_line2?: string | null
          ship_city: string
          ship_country?: string
          ship_full_name: string
          ship_phone?: string | null
          ship_postal_code?: string | null
          ship_state?: string | null
          shipping_inr?: number
          shipping_method?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal_inr: number
          tax_amount?: number
          total_inr: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_snapshot?: Json | null
          admin_notes?: string | null
          amount_tendered?: number | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          cashier_id?: string | null
          change_due?: number | null
          channel?: string
          counter_note?: string | null
          country_code?: string
          coupon_code?: string | null
          courier?: string | null
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          estimated_delivery?: string | null
          id?: string
          invoice_number?: string | null
          manual_discount?: number
          payment_method?: string
          paypal_capture_id?: string | null
          paypal_order_id?: string | null
          pos_session_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refunded_at?: string | null
          ship_address_line1?: string
          ship_address_line2?: string | null
          ship_city?: string
          ship_country?: string
          ship_full_name?: string
          ship_phone?: string | null
          ship_postal_code?: string | null
          ship_state?: string | null
          shipping_inr?: number
          shipping_method?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal_inr?: number
          tax_amount?: number
          total_inr?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_pos_session_id_fkey"
            columns: ["pos_session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          order_id: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          order_id: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          order_id?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          cashier_id: string
          closed_at: string | null
          closing_cash: number | null
          created_at: string
          difference: number | null
          expected_cash: number | null
          id: string
          note: string | null
          opened_at: string
          opening_float: number
          status: string
          updated_at: string
        }
        Insert: {
          cashier_id: string
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          difference?: number | null
          expected_cash?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opening_float?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cashier_id?: string
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          difference?: number | null
          expected_cash?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opening_float?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          allow_backorder: boolean
          badge: string | null
          barcode: string | null
          category_id: string | null
          compare_at_in: number | null
          compare_at_inr: number | null
          compare_at_us: number | null
          created_at: string
          description: string | null
          featured: boolean
          gallery: Json | null
          id: string
          image_url: string | null
          images: Json
          is_active: boolean
          low_stock_threshold: number
          name: string
          origin: string | null
          price_in: number | null
          price_inr: number
          price_us: number | null
          rating_avg: number
          rating_count: number
          sku: string | null
          slug: string
          stock: number
          tagline: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          allow_backorder?: boolean
          badge?: string | null
          barcode?: string | null
          category_id?: string | null
          compare_at_in?: number | null
          compare_at_inr?: number | null
          compare_at_us?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          gallery?: Json | null
          id?: string
          image_url?: string | null
          images?: Json
          is_active?: boolean
          low_stock_threshold?: number
          name: string
          origin?: string | null
          price_in?: number | null
          price_inr: number
          price_us?: number | null
          rating_avg?: number
          rating_count?: number
          sku?: string | null
          slug: string
          stock?: number
          tagline?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          allow_backorder?: boolean
          badge?: string | null
          barcode?: string | null
          category_id?: string | null
          compare_at_in?: number | null
          compare_at_inr?: number | null
          compare_at_us?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          gallery?: Json | null
          id?: string
          image_url?: string | null
          images?: Json
          is_active?: boolean
          low_stock_threshold?: number
          name?: string
          origin?: string | null
          price_in?: number | null
          price_inr?: number
          price_us?: number | null
          rating_avg?: number
          rating_count?: number
          sku?: string | null
          slug?: string
          stock?: number
          tagline?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      wishlist: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { _coupon_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status: "pending" | "paid" | "fulfilled" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      order_status: ["pending", "paid", "fulfilled", "cancelled"],
    },
  },
} as const
