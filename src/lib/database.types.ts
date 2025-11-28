export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          slug: string | null
          subscription_status: string
          suspended_at: string | null
          suspension_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          slug?: string | null
          subscription_status?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          slug?: string | null
          subscription_status?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string | null
          role: 'SUPERADMIN' | 'TENANT_ADMIN' | 'RECEPTION' | 'MECHANIC' | 'ACCOUNTANT'
          full_name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id?: string | null
          role: 'SUPERADMIN' | 'TENANT_ADMIN' | 'RECEPTION' | 'MECHANIC' | 'ACCOUNTANT'
          full_name: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          role?: 'SUPERADMIN' | 'TENANT_ADMIN' | 'RECEPTION' | 'MECHANIC' | 'ACCOUNTANT'
          full_name?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          price_monthly: number
          max_users: number
          max_vehicles: number
          max_storage_gb: number
          features: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price_monthly: number
          max_users: number
          max_vehicles: number
          max_storage_gb: number
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price_monthly?: number
          max_users?: number
          max_vehicles?: number
          max_storage_gb?: number
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tenant_subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan_id: string
          status: string
          started_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan_id: string
          status?: string
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plan_id?: string
          status?: string
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          license_plate: string
          make: string
          model: string
          year: number | null
          mileage: number
          vin: string | null
          color: string | null
          fuel_type: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          license_plate: string
          make: string
          model: string
          year?: number | null
          mileage?: number
          vin?: string | null
          color?: string | null
          fuel_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          license_plate?: string
          make?: string
          model?: string
          year?: number | null
          mileage?: number
          vin?: string | null
          color?: string | null
          fuel_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      repair_history: {
        Row: {
          id: string
          tenant_id: string
          vehicle_id: string
          client_id: string
          description: string
          mileage_at_repair: number | null
          cost: number
          performed_by: string | null
          repair_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          vehicle_id: string
          client_id: string
          description: string
          mileage_at_repair?: number | null
          cost?: number
          performed_by?: string | null
          repair_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          vehicle_id?: string
          client_id?: string
          description?: string
          mileage_at_repair?: number | null
          cost?: number
          performed_by?: string | null
          repair_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          estimated_duration_minutes: number
          price: number | null
          category: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          estimated_duration_minutes?: number
          price?: number | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          estimated_duration_minutes?: number
          price?: number | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          tenant_id: string
          client_id: string | null
          vehicle_id: string | null
          mechanic_id: string | null
          service_id: string | null
          appointment_date: string
          start_time: string
          end_time: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          notes: string | null
          customer_name: string
          customer_phone: string | null
          customer_email: string | null
          vehicle_plate: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id?: string | null
          vehicle_id?: string | null
          mechanic_id?: string | null
          service_id?: string | null
          appointment_date: string
          start_time: string
          end_time: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_email?: string | null
          vehicle_plate?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string | null
          vehicle_id?: string | null
          mechanic_id?: string | null
          service_id?: string | null
          appointment_date?: string
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_email?: string | null
          vehicle_plate?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interventions: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          vehicle_id: string
          mechanic_id: string | null
          description: string
          status: 'pending' | 'in_progress' | 'completed'
          estimated_cost: number
          actual_cost: number
          notes: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          vehicle_id: string
          mechanic_id?: string | null
          description: string
          status?: 'pending' | 'in_progress' | 'completed'
          estimated_cost?: number
          actual_cost?: number
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          vehicle_id?: string
          mechanic_id?: string | null
          description?: string
          status?: 'pending' | 'in_progress' | 'completed'
          estimated_cost?: number
          actual_cost?: number
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      intervention_parts: {
        Row: {
          id: string
          tenant_id: string
          intervention_id: string
          name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          intervention_id: string
          name: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          intervention_id?: string
          name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      intervention_photos: {
        Row: {
          id: string
          tenant_id: string
          intervention_id: string
          photo_url: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          intervention_id: string
          photo_url: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          intervention_id?: string
          photo_url?: string
          description?: string | null
          created_at?: string
        }
      }
    }
  }
}
